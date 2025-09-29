declare namespace Express {
    interface Request {
      session?: {
        userId: string
        roles: string[]
      };
      // Add other custom properties as needed
    }
  }

