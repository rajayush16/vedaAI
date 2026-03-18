import "express";

declare global {
  namespace Express {
    interface Request {
      teacher?: {
        id: string;
        name: string;
        email: string;
        schoolName: string;
        city: string;
        avatarInitials: string;
      };
    }
  }
}

export {};
