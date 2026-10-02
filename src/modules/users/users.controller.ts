import { Request, Response } from "express";

import { BadRequestError, NotFoundError } from "@errors";
import { ERole } from "@generated/prisma/enums";
import { issueTokens } from "@utils/auth/auth.utils";
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
  const userId = req.user!.userId;
  const { role, ...data } = req.body;

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.roles.includes(role)) {
    throw new BadRequestError("Role already added");
  }

  let updatedUser;

  if (role === ERole.OWNER) {
    const { companyName, phone } = req.body;
    updatedUser = await userRepository.createOwner(userId, {
      companyName,
      phone,
    });
  }
  if (role === ERole.COURIER) {
    const { vehicleType, phone } = req.body;
    updatedUser = await userRepository.createCourier(userId, {
      vehicleType,
      phone,
    });
  }

  const tokens = await issueTokens(userId);

  return res.status(HTTP_STATUS.CREATED_201).json(tokens);
};

// UPDATE
export const updateUserController = async (req: Request, res: Response) => {
  const { name } = req.body;
  const user = await userRepository.update(req.user!.userId, { name });

  return res.status(HTTP_STATUS.OK_200).json(user);
};

export const updateOwnerController = async (req: Request, res: Response) => {
  const { companyName, phone } = req.body;
  const profile = await userRepository.updateOwner(req.user!.userId, {
    companyName,
    phone,
  });

  return res.status(HTTP_STATUS.OK_200).json(profile);
};

export const updateCourierController = async (req: Request, res: Response) => {
  const { vehicleType, phone } = req.body;
  const profile = await userRepository.updateCourier(req.user!.userId, {
    vehicleType,
    phone,
  });

  return res.status(HTTP_STATUS.OK_200).json(profile);
};

// DELETE
export const deleteRoleController = async (req: Request, res: Response) => {
  const role = req.query.role as ERole;
  const userId = req.user!.userId;

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.roles.includes(role as ERole)) {
    throw new BadRequestError("User doesn't have this role");
  }

  // remove current role
  const roles = user.roles.filter((r) => r !== role);

  if (role === ERole.OWNER) {
    await userRepository.deleteOwner(userId, roles);
  }
  if (role === ERole.COURIER) {
    await userRepository.deleteCourier(userId, roles);
  }

  const tokens = await issueTokens(userId);

  return res
    .status(HTTP_STATUS.OK_200)
    .json({ message: "User role was deleted", tokens });
};

export const deleteUserController = async (req: Request, res: Response) => {
  await userRepository.delete(req.user!.userId);
  return res.sendStatus(HTTP_STATUS.OK_200);
};
