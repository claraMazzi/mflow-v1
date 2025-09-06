import { Request, Response } from "express";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  RecoverPasswordDto,
  UpdateUserDto,
} from "../../domain";
import { UserService } from "../services";

export class UserController {
  constructor(readonly userService: UserService) {}

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.log(`${error}`);
    return res.status(500).json({ error: "Internal server error" });
  };

  getUserById = (req: Request, res: Response) => {
    const { id } = req.params;
    this.userService
      .getUserById(id)
      .then((user) => res.json(user))
      .catch((error) => this.handleError(error, res));
  };

  updateUserById = (req: Request, res: Response) => {
    const [error, updateUserDto] = UpdateUserDto.create(req.body);

    if (error) return res.status(400).json({ error });

    this.userService
      .updateUserById(updateUserDto!)
      .then((user) => res.json(user))
      .catch((error) => this.handleError(error, res));
  };

  deleteUser = (req: Request, res: Response) => {
    const { id } = req.params;
    this.userService
      .deleteUser(id)
      .then((user) => res.json("User deleted successfully from Data Base"))
      .catch((error) => this.handleError(error, res));
  };

  getAllUsers = (req: Request, res: Response) => {
    const adminId = req.session?.userId ?? "";

    this.userService
      .getAllUsers(adminId)
      .then((user) => res.json(user))
      .catch((error) => this.handleError(error, res));
  };

  getUserRoles = (req: Request, res: Response) => {
    throw Error("deleteUser to be implemented");
  };

  updateUserRole = (req: Request, res: Response) => {
    throw Error("deleteUser to be implemented");
  };

  inviteUserWithRole = (req: Request, res: Response) => {
    throw Error("deleteUser to be implemented");
  };

  updateUserRoleWithInvitation = (req: Request, res: Response) => {
    throw Error("deleteUser to be implemented");
  };
}
