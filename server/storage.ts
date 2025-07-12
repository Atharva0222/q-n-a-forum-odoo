import {
  users,
  questions,
  answers,
  tags,
  questionTags,
  votes,
  notifications,
  type User,
  type UpsertUser,
  type Question,
  type Answer,
  type Tag,
  type Vote,
  type Notification,
  type InsertQuestion,
  type InsertAnswer,
  type InsertTag,
  type InsertVote,
  type InsertNotification,
  type QuestionWithDetails,
  type AnswerWithDetails,
  type NotificationWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, asc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Question operations
  createQuestion(question: InsertQuestion, tagNames: string[]): Promise<QuestionWithDetails>;
  getQuestions(limit?: number, offset?: number, sortBy?: 'newest' | 'active' | 'unanswered' | 'votes'): Promise<QuestionWithDetails[]>;
  getQuestionById(id: number): Promise<QuestionWithDetails | undefined>;
  updateQuestionViews(id: number): Promise<void>;
  acceptAnswer(questionId: number, answerId: number, authorId: string): Promise<void>;

  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<AnswerWithDetails>;
  getAnswersByQuestionId(questionId: number): Promise<AnswerWithDetails[]>;

  // Tag operations
  createTag(tag: InsertTag): Promise<Tag>;
  getTags(): Promise<Tag[]>;
  getPopularTags(limit?: number): Promise<Tag[]>;
  searchTags(query: string): Promise<Tag[]>;

  // Vote operations
  createVote(vote: InsertVote): Promise<Vote>;
  getUserVote(userId: string, targetType: string, targetId: number): Promise<Vote | undefined>;
  updateVote(voteId: number, voteType: string): Promise<Vote>;
  deleteVote(voteId: number): Promise<void>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<NotificationWithDetails[]>;
  markNotificationAsRead(id: number, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Stats
  getStats(): Promise<{
    totalQuestions: number;
    totalAnswers: number;
    totalUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Question operations
  async createQuestion(question: InsertQuestion, tagNames: string[]): Promise<QuestionWithDetails> {
    return await db.transaction(async (tx) => {
      // Create question
      const [newQuestion] = await tx.insert(questions).values(question).returning();

      // Handle tags
      const tagIds: number[] = [];
      for (const tagName of tagNames) {
        let tag = await tx.select().from(tags).where(eq(tags.name, tagName.toLowerCase())).limit(1);
        if (tag.length === 0) {
          const [newTag] = await tx.insert(tags).values({ 
            name: tagName.toLowerCase(),
            color: this.getRandomTagColor()
          }).returning();
          tagIds.push(newTag.id);
        } else {
          tagIds.push(tag[0].id);
          // Update question count
          await tx.update(tags)
            .set({ questionCount: sql`${tags.questionCount} + 1` })
            .where(eq(tags.id, tag[0].id));
        }
      }

      // Create question-tag relationships
      for (const tagId of tagIds) {
        await tx.insert(questionTags).values({
          questionId: newQuestion.id,
          tagId: tagId,
        });
      }

      // Get the complete question with details
      return await this.getQuestionByIdTransaction(tx, newQuestion.id);
    });
  }

  async getQuestions(
    limit = 20, 
    offset = 0, 
    sortBy: 'newest' | 'active' | 'unanswered' | 'votes' = 'newest'
  ): Promise<QuestionWithDetails[]> {
    let orderBy;
    switch (sortBy) {
      case 'votes':
        orderBy = desc(questions.votes);
        break;
      case 'active':
        orderBy = desc(questions.updatedAt);
        break;
      case 'unanswered':
        orderBy = desc(questions.createdAt);
        break;
      default:
        orderBy = desc(questions.createdAt);
    }

    const questionsQuery = db
      .select({
        question: questions,
        author: users,
      })
      .from(questions)
      .leftJoin(users, eq(questions.authorId, users.id))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    if (sortBy === 'unanswered') {
      questionsQuery.where(sql`${questions.acceptedAnswerId} IS NULL`);
    }

    const questionResults = await questionsQuery;

    // Get tags and answer counts for each question
    const questionIds = questionResults.map(q => q.question.id);
    
    const tagsData = await db
      .select({
        questionId: questionTags.questionId,
        tag: tags,
      })
      .from(questionTags)
      .leftJoin(tags, eq(questionTags.tagId, tags.id))
      .where(inArray(questionTags.questionId, questionIds));

    const answerCounts = await db
      .select({
        questionId: answers.questionId,
        count: sql<number>`count(*)::int`,
      })
      .from(answers)
      .where(inArray(answers.questionId, questionIds))
      .groupBy(answers.questionId);

    // Combine the data
    return questionResults.map(({ question, author }) => {
      const questionTags = tagsData
        .filter(t => t.questionId === question.id)
        .map(t => t.tag)
        .filter(Boolean) as Tag[];

      const answerCount = answerCounts.find(a => a.questionId === question.id)?.count || 0;

      return {
        ...question,
        author: author!,
        tags: questionTags,
        answerCount,
      };
    });
  }

  async getQuestionById(id: number): Promise<QuestionWithDetails | undefined> {
    return await this.getQuestionByIdTransaction(db, id);
  }

  private async getQuestionByIdTransaction(tx: any, id: number): Promise<QuestionWithDetails> {
    const [questionResult] = await tx
      .select({
        question: questions,
        author: users,
      })
      .from(questions)
      .leftJoin(users, eq(questions.authorId, users.id))
      .where(eq(questions.id, id));

    if (!questionResult) {
      throw new Error('Question not found');
    }

    // Get tags
    const tagsData = await tx
      .select({
        tag: tags,
      })
      .from(questionTags)
      .leftJoin(tags, eq(questionTags.tagId, tags.id))
      .where(eq(questionTags.questionId, id));

    // Get answer count
    const [answerCountResult] = await tx
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(answers)
      .where(eq(answers.questionId, id));

    // Get accepted answer if exists
    let acceptedAnswer;
    if (questionResult.question.acceptedAnswerId) {
      const [acceptedAnswerResult] = await tx
        .select({
          answer: answers,
          author: users,
        })
        .from(answers)
        .leftJoin(users, eq(answers.authorId, users.id))
        .where(eq(answers.id, questionResult.question.acceptedAnswerId));

      if (acceptedAnswerResult) {
        acceptedAnswer = {
          ...acceptedAnswerResult.answer,
          author: acceptedAnswerResult.author!,
        };
      }
    }

    return {
      ...questionResult.question,
      author: questionResult.author!,
      tags: tagsData.map((t: any) => t.tag).filter(Boolean) as Tag[],
      answerCount: answerCountResult.count,
      acceptedAnswer,
    };
  }

  async updateQuestionViews(id: number): Promise<void> {
    await db
      .update(questions)
      .set({ views: sql`${questions.views} + 1` })
      .where(eq(questions.id, id));
  }

  async acceptAnswer(questionId: number, answerId: number, authorId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Verify the user owns the question
      const [question] = await tx
        .select()
        .from(questions)
        .where(and(eq(questions.id, questionId), eq(questions.authorId, authorId)));

      if (!question) {
        throw new Error('Question not found or unauthorized');
      }

      // Update question with accepted answer
      await tx
        .update(questions)
        .set({ acceptedAnswerId: answerId })
        .where(eq(questions.id, questionId));

      // Mark answer as accepted
      await tx
        .update(answers)
        .set({ isAccepted: true })
        .where(eq(answers.id, answerId));

      // Create notification for answer author
      const [answer] = await tx
        .select()
        .from(answers)
        .where(eq(answers.id, answerId));

      if (answer && answer.authorId !== authorId) {
        await tx.insert(notifications).values({
          userId: answer.authorId,
          type: 'accepted',
          title: 'Answer Accepted',
          message: 'Your answer has been accepted!',
          questionId: questionId,
          answerId: answerId,
          triggeredById: authorId,
        });
      }
    });
  }

  // Answer operations
  async createAnswer(answer: InsertAnswer): Promise<AnswerWithDetails> {
    return await db.transaction(async (tx) => {
      const [newAnswer] = await tx.insert(answers).values(answer).returning();

      // Get the author
      const [author] = await tx
        .select()
        .from(users)
        .where(eq(users.id, newAnswer.authorId));

      // Create notification for question author
      const [question] = await tx
        .select()
        .from(questions)
        .where(eq(questions.id, answer.questionId));

      if (question && question.authorId !== answer.authorId) {
        await tx.insert(notifications).values({
          userId: question.authorId,
          type: 'answer',
          title: 'New Answer',
          message: 'Someone answered your question!',
          questionId: answer.questionId,
          answerId: newAnswer.id,
          triggeredById: answer.authorId,
        });
      }

      return {
        ...newAnswer,
        author: author!,
      };
    });
  }

  async getAnswersByQuestionId(questionId: number): Promise<AnswerWithDetails[]> {
    const answerResults = await db
      .select({
        answer: answers,
        author: users,
      })
      .from(answers)
      .leftJoin(users, eq(answers.authorId, users.id))
      .where(eq(answers.questionId, questionId))
      .orderBy(desc(answers.votes), desc(answers.createdAt));

    return answerResults.map(({ answer, author }) => ({
      ...answer,
      author: author!,
    }));
  }

  // Tag operations
  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(asc(tags.name));
  }

  async getPopularTags(limit = 10): Promise<Tag[]> {
    return await db
      .select()
      .from(tags)
      .orderBy(desc(tags.questionCount))
      .limit(limit);
  }

  async searchTags(query: string): Promise<Tag[]> {
    return await db
      .select()
      .from(tags)
      .where(sql`${tags.name} ILIKE ${`%${query}%`}`)
      .orderBy(desc(tags.questionCount))
      .limit(10);
  }

  // Vote operations
  async createVote(vote: InsertVote): Promise<Vote> {
    return await db.transaction(async (tx) => {
      const [newVote] = await tx.insert(votes).values(vote).returning();

      // Update vote count on target
      const voteChange = vote.voteType === 'up' ? 1 : -1;
      
      if (vote.targetType === 'question') {
        await tx
          .update(questions)
          .set({ votes: sql`${questions.votes} + ${voteChange}` })
          .where(eq(questions.id, vote.targetId));
      } else if (vote.targetType === 'answer') {
        await tx
          .update(answers)
          .set({ votes: sql`${answers.votes} + ${voteChange}` })
          .where(eq(answers.id, vote.targetId));
      }

      return newVote;
    });
  }

  async getUserVote(userId: string, targetType: string, targetId: number): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.targetType, targetType),
          eq(votes.targetId, targetId)
        )
      );

    return vote;
  }

  async updateVote(voteId: number, voteType: string): Promise<Vote> {
    return await db.transaction(async (tx) => {
      // Get the existing vote
      const [existingVote] = await tx
        .select()
        .from(votes)
        .where(eq(votes.id, voteId));

      if (!existingVote) {
        throw new Error('Vote not found');
      }

      // Calculate vote change
      const oldChange = existingVote.voteType === 'up' ? 1 : -1;
      const newChange = voteType === 'up' ? 1 : -1;
      const totalChange = newChange - oldChange;

      // Update the vote
      const [updatedVote] = await tx
        .update(votes)
        .set({ voteType })
        .where(eq(votes.id, voteId))
        .returning();

      // Update vote count on target
      if (existingVote.targetType === 'question') {
        await tx
          .update(questions)
          .set({ votes: sql`${questions.votes} + ${totalChange}` })
          .where(eq(questions.id, existingVote.targetId));
      } else if (existingVote.targetType === 'answer') {
        await tx
          .update(answers)
          .set({ votes: sql`${answers.votes} + ${totalChange}` })
          .where(eq(answers.id, existingVote.targetId));
      }

      return updatedVote;
    });
  }

  async deleteVote(voteId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Get the existing vote
      const [existingVote] = await tx
        .select()
        .from(votes)
        .where(eq(votes.id, voteId));

      if (!existingVote) {
        throw new Error('Vote not found');
      }

      // Delete the vote
      await tx.delete(votes).where(eq(votes.id, voteId));

      // Update vote count on target
      const voteChange = existingVote.voteType === 'up' ? -1 : 1;
      
      if (existingVote.targetType === 'question') {
        await tx
          .update(questions)
          .set({ votes: sql`${questions.votes} + ${voteChange}` })
          .where(eq(questions.id, existingVote.targetId));
      } else if (existingVote.targetType === 'answer') {
        await tx
          .update(answers)
          .set({ votes: sql`${answers.votes} + ${voteChange}` })
          .where(eq(answers.id, existingVote.targetId));
      }
    });
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, limit = 20): Promise<NotificationWithDetails[]> {
    const notificationResults = await db
      .select({
        notification: notifications,
        question: questions,
        answer: answers,
        triggeredBy: users,
      })
      .from(notifications)
      .leftJoin(questions, eq(notifications.questionId, questions.id))
      .leftJoin(answers, eq(notifications.answerId, answers.id))
      .leftJoin(users, eq(notifications.triggeredById, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return notificationResults.map(({ notification, question, answer, triggeredBy }) => ({
      ...notification,
      question: question || undefined,
      answer: answer || undefined,
      triggeredBy: triggeredBy || undefined,
    }));
  }

  async markNotificationAsRead(id: number, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return result.count;
  }

  // Stats
  async getStats(): Promise<{
    totalQuestions: number;
    totalAnswers: number;
    totalUsers: number;
  }> {
    const [questionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions);

    const [answerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(answers);

    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    return {
      totalQuestions: questionCount.count,
      totalAnswers: answerCount.count,
      totalUsers: userCount.count,
    };
  }

  private getRandomTagColor(): string {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#8B5CF6', // purple
      '#F59E0B', // yellow
      '#EF4444', // red
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
      '#EC4899', // pink
      '#6366F1', // indigo
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const storage = new DatabaseStorage();
