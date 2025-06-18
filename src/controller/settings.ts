import { Request, Response } from "express";import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createCompanyProfile = async (req: Request, res: Response) => {
  const {
    email,
    contactNumber,
    alternateContactNumber,
    GSTIN,
    HSN,
    websiteURL,
    address,
  } = req.body;

  if (
    !email ||
    !contactNumber ||
    !alternateContactNumber ||
    !GSTIN ||
    !HSN ||
    !websiteURL ||
    !address
  ) {
    res.status(400).json({
      message: "Invalid Company Profile Details",
    });
    return;
  }
  try {
    await prisma.companyProfile.create({
      data: {
        email,
        contactNumber,
        alternateContactNumber,
        GSTIN,
        HSN,
        websiteURL,
        address,
      },
    });

    res.status(200).json({
      message: "Company Profile Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getCompanyProfile = async (req: Request, res: Response) => {
  try {
    const companyProfile = await prisma.companyProfile.findFirst();
    if (companyProfile) {
      res.status(200).json({
        message: "Company Profile Details",
        data: companyProfile,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateCompanyProfile = async (req: Request, res: Response) => {
  const {
    email,
    contactNumber,
    alternateContactNumber,
    GSTIN,
    HSN,
    websiteURL,
    address,
  } = req.body;
  const id = req.params.id;

  if (
    !email ||
    !contactNumber ||
    !alternateContactNumber ||
    !GSTIN ||
    !HSN ||
    !websiteURL ||
    !address
  ) {
    res.status(400).json({
      message: "Invalid Company Profile Details",
    });
    return;
  }
  try {
    await prisma.companyProfile.update({
      where: {
        id,
      },
      data: {
        email,
        contactNumber,
        alternateContactNumber,
        GSTIN,
        HSN,
        websiteURL,
        address,
      },
    });

    res.status(200).json({
      message: "Company Profile Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};


export const createGeneralSettings = async (req: Request, res: Response) => {
  const {
    expenseTypes,
    vehicleTypes,
  } = req.body;

  if (
    !expenseTypes ||
    !vehicleTypes
  ) {
    res.status(400).json({
      message: "Invalid General Settings Details",
    });
    return;
  }
  try {
    await prisma.generalSettings.create({
      data: {
        expenseTypes,
        vehicleTypes,
      },
    });

    res.status(200).json({
      message: "General Settings Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getGeneralSettings = async (req: Request, res: Response) => {
  try {
    const generalSettings = await prisma.generalSettings.findFirst();
    if (generalSettings) {
      res.status(200).json({
        message: "General Settings Details",
        data: generalSettings,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateGeneralSettings = async (req: Request, res: Response) => {
  const {
    expenseTypes,
    vehicleTypes,
  } = req.body;
  const id = req.params.id;

  if (
    !expenseTypes ||
    !vehicleTypes
  ) {
    res.status(400).json({
      message: "Invalid General Settings Details",
    });
    return;
  }
  try {
    await prisma.generalSettings.update({
      where: {
        id: id,
      },
      data: {
        expenseTypes,
        vehicleTypes,
      },
    });

    res.status(200).json({
      message: "General Settings Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createBankDetails = async (req: Request, res: Response) => {
  const {
    name,
    accountNumber,
    ifscCode,
  } = req.body;

  if (
    !name ||
    !accountNumber ||
    !ifscCode
  ) {
    res.status(400).json({
      message: "Invalid Bank Details",
    });
    return;
  }
  try {
    await prisma.bankDetails.create({
      data: {
        name,
        accountNumber,
        ifscCode,
      },
    });

    res.status(200).json({
      message: "Bank Details Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getBankDetails = async (req: Request, res: Response) => {
  try {
    const bankDetails = await prisma.bankDetails.findFirst();
    if (bankDetails) {
      res.status(200).json({
        message: "Bank Details",
        data: bankDetails,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateBankDetails = async (req: Request, res: Response) => {
  const {
    name,
    accountNumber,
    ifscCode,
  } = req.body;
  const id = req.params.id;

  if (
    !name ||
    !accountNumber ||
    !ifscCode
  ) {
    res.status(400).json({
      message: "Invalid Bank Details",
    });
    return;
  }
  try {
    await prisma.bankDetails.update({
      where: {
        id,
      },
      data: {
        name,
        accountNumber,
        ifscCode,
      },
    });

    res.status(200).json({
      message: "Bank Details Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};