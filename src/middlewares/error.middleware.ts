import type {Request, Response, NextFunction} from 'express';
import ErrorHandler from '../utils/ErrorHandler';
import { logger } from '../utils/logger';

export const ErrorMiddleware= (err:any, req:Request, res:Response,next:NextFunction)=>{
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log full error stack in development/internal logs
  logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${err.stack}`);

  // Wrong Mongoose Object ID Error
  if(err.name === 'CastError'){
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  //duplicate key error
  if(err.code === 11000){
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }
  // Wrong JWT error
  if(err.name === 'JsonWebTokenError'){
    const message = 'JSON Web Token is invalid. Try Again!!!';
    err = new ErrorHandler(message, 400);
  }
  // JWT Expire error
  if(err.name === 'TokenExpiredError'){
    const message = 'JSON Web Token is expired. Try Again!!!';
    err = new ErrorHandler(message, 400);
  }
  
  res.status(err.statusCode).json({
    success: false,
    message: err.message
  });

}
