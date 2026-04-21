import type {Request, Response, NextFunction} from 'express';
import {catchAsyncError} from './catchAsyncError.middleware';
import ErrorHandler from '../utils/ErrorHandler';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { redis } from '../config/redis';
import { checkDeviceLimit } from './device.middleware';

// authenticate user
export const isAuthenticated = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    let access_token = req.cookies.access_token;

    // Check Authorization header if cookie is missing
    if (!access_token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
            access_token = authHeader.split(" ")[1];
        }
    }

    if (!access_token) {
        return next(new ErrorHandler("please login to access this resources", 401));
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
    
    if (!decoded) {
        return next(new ErrorHandler("Invalid token, please login again", 401));
    }
    const user = await redis.get(decoded.id);
    if (!user) {
        return next(new ErrorHandler("User not found, please login again", 401));
    }
    req.user = JSON.parse(user);
    
    // Check device limit
    return checkDeviceLimit(req, res, next);
}
);

// validate user role
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    }
}

