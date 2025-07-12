import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  views: integer("views").default(0),
  votes: integer("votes").default(0),
  acceptedAnswerId: integer("accepted_answer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  votes: integer("votes").default(0),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  questionCount: integer("question_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionTags = pgTable("question_tags", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetType: varchar("target_type").notNull(), // 'question' or 'answer'
  targetId: integer("target_id").notNull(),
  voteType: varchar("vote_type").notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'answer', 'comment', 'mention', 'accepted'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  questionId: integer("question_id").references(() => questions.id),
  answerId: integer("answer_id").references(() => answers.id),
  triggeredById: varchar("triggered_by_id").references(() => users.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  questions: many(questions),
  answers: many(answers),
  votes: many(votes),
  notifications: many(notifications),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  author: one(users, {
    fields: [questions.authorId],
    references: [users.id],
  }),
  answers: many(answers),
  tags: many(questionTags),
  acceptedAnswer: one(answers, {
    fields: [questions.acceptedAnswerId],
    references: [answers.id],
  }),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  author: one(users, {
    fields: [answers.authorId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  questions: many(questionTags),
}));

export const questionTagsRelations = relations(questionTags, ({ one }) => ({
  question: one(questions, {
    fields: [questionTags.questionId],
    references: [questions.id],
  }),
  tag: one(tags, {
    fields: [questionTags.tagId],
    references: [tags.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [notifications.questionId],
    references: [questions.id],
  }),
  answer: one(answers, {
    fields: [notifications.answerId],
    references: [answers.id],
  }),
  triggeredBy: one(users, {
    fields: [notifications.triggeredById],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  views: true,
  votes: true,
  acceptedAnswerId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  votes: true,
  isAccepted: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  questionCount: true,
  createdAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types for API responses
export type QuestionWithDetails = Question & {
  author: User;
  tags: Tag[];
  answerCount: number;
  acceptedAnswer?: Answer;
};

export type AnswerWithDetails = Answer & {
  author: User;
};

export type NotificationWithDetails = Notification & {
  question?: Question;
  answer?: Answer;
  triggeredBy?: User;
};
