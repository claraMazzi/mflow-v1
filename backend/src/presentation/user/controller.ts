import { Request, Response } from "express";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  RecoverPasswordDto,
  UpdateUserDto,
} from "../../domain";
import { UserService } from "../services";
import { UpdateUserRolesDto } from "../../domain/dtos/user/update-user-roles.dto";
import { UpdateUsersRolesDto } from "../../domain/dtos/user/update-users-roles.dto";

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

  getLoggedUser = (req: Request, res: Response) => {
    const id  = req.session?.userId ?? "";
    this.userService
      .getUserById(id)
      .then((user) => res.json(user))
      .catch((error) => this.handleError(error, res));
  };

  updateUserById = (req: Request, res: Response) => {
    const id  = req.session?.userId ?? "";

    console.log('ACAAAA', {...req.body, id})

    const [error, updateUserDto] = UpdateUserDto.create({...req.body, id});

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

  updateUserRolesById = (req: Request, res: Response) => {
    const { id: userId } = req.params;
    const userData = req.body;
    const adminId = req.session?.userId ?? "";

    if (adminId === userId)
      return res.status(400).json({ error: "You can't update your own roles" });

    if (!userId) {
      return res.status(401).json({ error: "No User id provided" });
    }

    const [error, updateUserRolesDto] = UpdateUserRolesDto.create({
      id: userId,
      ...userData,
    });

    if (error || !updateUserRolesDto) return res.status(400).json({ error });

    this.userService
      .updateUserRolesById(updateUserRolesDto)
      .then((updatedUser) => res.json(updatedUser))
      .catch((error) => this.handleError(error, res));
  };

  inviteUsersWithRole = (req: Request, res: Response) => {
    // throw Error("deleteUser to be implemented");
    const adminId = req.session?.userId ?? "";
    const usersData = req.body;

    if (!usersData) {
      return res.status(401).json({ error: "No Users data provided" });
    }

    if (!Array.isArray(usersData)) {
      return res.status(400).json({ error: "Users data should be an array" });
    }

    const [error, updateUserRolesDto] = UpdateUsersRolesDto.create({
      users: usersData,
    });

    if (error || !updateUserRolesDto) return res.status(400).json({ error });
   
    this.userService
    .inviteUsersWithRole(updateUserRolesDto, adminId)
    .then((updatedUser) => res.json(updatedUser))
    .catch((error) => this.handleError(error, res));
  };

  getUserDataFromInvitation = (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    this.userService
    .getUserDataFromInvitation(token)
    .then((roles) => res.json(roles))
    .catch((error) => this.handleError(error, res));

  };
}
