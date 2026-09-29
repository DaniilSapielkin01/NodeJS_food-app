import { Request, Response } from "express";

import { BadRequestError, NotFoundError } from "@errors";
import { ERole } from "@generated/prisma/enums";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { userRepository } from "./users.repository";

export const getUserController = async (req: Request, res: Response) => {
  const role = req.query.role as ERole | undefined;
  const user = await userRepository.findById(req.user!.userId, role);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return res.status(HTTP_STATUS.OK_200).json(user);
};

export const addRoleController = async (req: Request, res: Response) => {
  const body = req.body;

  const user = await userRepository.findById(body.userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.roles.includes(body.role)) {
    throw new BadRequestError("Role not found");
  }

  if (body.role === ERole.OWNER) {
    await userRepository.createOwnerProfile(body.userId, body);
  }
  if (body.role === ERole.COURIER) {
    await userRepository.createCourierProfile(body.userId, body);
  }

  return res.sendStatus(HTTP_STATUS.CREATED_201);
};

export const updateUserController = async (req: Request, res: Response) => {};

export const deleteUserController = async (req: Request, res: Response) => {
  await userRepository.delete(req.user!.userId);
  return res.sendStatus(HTTP_STATUS.OK_200);
};
