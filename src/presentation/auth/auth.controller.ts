import type { NextFunction, Request, Response } from "express";
import type { AuthService } from "../services/auth.service";
import { validateRegisterDto } from "./dtos/register.dto";
import { validateLoginDto } from "./dtos/login.dto";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = (req: Request, res: Response, next: NextFunction): void => {
    const dto = validateRegisterDto(req.body);
    this.authService
      .register(dto)
      .then((result) => {
        res.status(201).json(result);
      })
      .catch(next);
  };

  login = (req: Request, res: Response, next: NextFunction): void => {
    const dto = validateLoginDto(req.body);
    this.authService
      .login(dto)
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(next);
  };
}
