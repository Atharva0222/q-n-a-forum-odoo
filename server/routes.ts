import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertQuestionSchema, 
  insertAnswerSchema, 
  insertVoteSchema,
  insertTagSchema 
} from "@shared/schema";
import { z } from "zod";
import { aiAssistant } from "./ai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Question routes
  app.get('/api/questions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const sortBy = (req.query.sortBy as 'newest' | 'active' | 'unanswered' | 'votes') || 'newest';

      const questions = await storage.getQuestions(limit, offset, sortBy);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get('/api/questions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const question = await storage.getQuestionById(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Update view count
      await storage.updateQuestionViews(id);
      question.views = (question.views || 0) + 1;

      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.post('/api/questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        authorId: userId,
      });

      const tags = req.body.tags || [];
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: "Tags must be an array" });
      }

      const question = await storage.createQuestion(questionData, tags);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.post('/api/questions/:id/accept-answer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionId = parseInt(req.params.id);
      const { answerId } = req.body;

      if (isNaN(questionId) || !answerId) {
        return res.status(400).json({ message: "Invalid question ID or answer ID" });
      }

      await storage.acceptAnswer(questionId, answerId, userId);
      res.json({ message: "Answer accepted successfully" });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  // Answer routes
  app.get('/api/questions/:id/answers', async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const answers = await storage.getAnswersByQuestionId(questionId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching answers:", error);
      res.status(500).json({ message: "Failed to fetch answers" });
    }
  });

  app.post('/api/questions/:id/answers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionId = parseInt(req.params.id);

      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const answerData = insertAnswerSchema.parse({
        ...req.body,
        questionId,
        authorId: userId,
      });

      const answer = await storage.createAnswer(answerData);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating answer:", error);
      res.status(500).json({ message: "Failed to create answer" });
    }
  });

  // Vote routes
  app.post('/api/votes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const voteData = insertVoteSchema.parse({
        ...req.body,
        userId,
      });

      // Check if user already voted
      const existingVote = await storage.getUserVote(userId, voteData.targetType, voteData.targetId);

      if (existingVote) {
        if (existingVote.voteType === voteData.voteType) {
          // Same vote, remove it
          await storage.deleteVote(existingVote.id);
          return res.json({ message: "Vote removed" });
        } else {
          // Different vote, update it
          const updatedVote = await storage.updateVote(existingVote.id, voteData.voteType);
          return res.json(updatedVote);
        }
      }

      // Create new vote
      const vote = await storage.createVote(voteData);
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error voting:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  app.get('/api/votes/:targetType/:targetId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetType, targetId } = req.params;

      const vote = await storage.getUserVote(userId, targetType, parseInt(targetId));
      res.json(vote || null);
    } catch (error) {
      console.error("Error fetching user vote:", error);
      res.status(500).json({ message: "Failed to fetch vote" });
    }
  });

  // Tag routes
  app.get('/api/tags', async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.get('/api/tags/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const tags = await storage.searchTags(query);
      res.json(tags);
    } catch (error) {
      console.error("Error searching tags:", error);
      res.status(500).json({ message: "Failed to search tags" });
    }
  });

  app.get('/api/tags/popular', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const tags = await storage.getPopularTags(limit);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching popular tags:", error);
      res.status(500).json({ message: "Failed to fetch popular tags" });
    }
  });

  app.post('/api/tags', isAuthenticated, async (req: any, res) => {
    try {
      const tagData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;

      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = parseInt(req.params.id);

      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }

      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Users route  
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Stats route
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/assist', isAuthenticated, async (req: any, res) => {
    try {
      const { content, action, context } = req.body;
      
      if (!content || !action) {
        return res.status(400).json({ message: "Content and action are required" });
      }

      const result = await aiAssistant.processContent({ content, action, context });
      res.json(result);
    } catch (error) {
      console.error("Error processing AI assist:", error);
      res.status(500).json({ message: "Failed to process AI assistance" });
    }
  });

  app.post('/api/ai/question-suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const { topic } = req.body;
      
      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      const suggestions = await aiAssistant.generateQuestionSuggestions(topic);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating question suggestions:", error);
      res.status(500).json({ message: "Failed to generate question suggestions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
