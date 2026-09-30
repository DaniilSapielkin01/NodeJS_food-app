import { Request, Response } from "express";

import { BadRequestError, NotFoundError } from "@errors";
import { ERole } from "@generated/prisma/enums";
import { HTTP_STATUS } from "@utils/constants/statuses";

import { userRepository } from "./users.repository";

// GET
export const getUserController = async (req: Request, res: Response) => {
  const role = req.query.role as ERole | undefined;
  const user = await userRepository.findById(req.user!.userId, role);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return res.status(HTTP_STATUS.OK_200).json(user);
};

// ADD
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
    await userRepository.createOwner(body.userId, body);
  }
  if (body.role === ERole.COURIER) {
    await userRepository.createCourier(body.userId, body);
  }

  return res.sendStatus(HTTP_STATUS.CREATED_201);
};

// UPDATE
export const updateUserController = async (req: Request, res: Response) => {
  const user = await userRepository.update(req.user!.userId, req.body);

  return res.status(HTTP_STATUS.OK_200).json(user);
};

export const updateOwnerController = async (req: Request, res: Response) => {
  const user = await userRepository.updateOwner(req.user!.userId, req.body);

  return res.status(HTTP_STATUS.OK_200).json(user);
};
export const updateCourierController = async (req: Request, res: Response) => {
  const user = await userRepository.updateCourier(req.user!.userId, req.body);

  return res.status(HTTP_STATUS.OK_200).json(user);
};

// DELETE
export const deleteRoleController = async (req: Request, res: Response) => {
  const role = req.query.role?.toString().toUpperCase() as ERole;
  const userId = req.user!.userId;

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.roles.includes(role as ERole)) {
    throw new NotFoundError("User doesn't have this role");
  }

  // remove current role
  const roles = user.roles.filter((r) => r !== role);

  if (role === ERole.OWNER) {
    await userRepository.deleteOwner(userId, roles);
  }
  if (role === ERole.COURIER) {
    await userRepository.deleteCourier(userId, roles);
  }

  return res
    .status(HTTP_STATUS.OK_200)
    .json({ message: "User role was delete" });
};

export const deleteUserController = async (req: Request, res: Response) => {
  await userRepository.delete(req.user!.userId);
  return res.sendStatus(HTTP_STATUS.OK_200);
};
