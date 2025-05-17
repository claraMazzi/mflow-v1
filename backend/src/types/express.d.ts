declare namespace Express {
    interface Request {
      session?: {
        userId: string
      };
      // Add other custom properties as needed
    }
  }

