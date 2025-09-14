import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { LRData, LREmailBody, sendLREmailToClient } from "./utils/LREmail";
import { FMData, FMEmailBody, sendFMEmailToClient } from "./utils/FMEmail";
import {
  clearFMCache,
  clearGetAllRecordPaymentCache,
  clearGetRecentTransactionCache,
  clearLRCache,
  clearVendorCache,
  redisGetOrSetFunctions,
} from "./utils/redis";
const prisma = new PrismaClient();

export const createLR = async (req: Request, res: Response) => {
  const {
    branchId,
    adminId,
    lrNumber,
    date,
    from,
    to,
    insurance,
    consignorName,
    consignorGSTIN,
    consignorPincode,
    consignorAddress,
    consigneeName,
    consigneeGSTIN,
    consigneePincode,
    consigneeAddress,
    noOfPackages,
    methodOfPacking,
    description,
    invoiceNo,
    invoiceDate,
    value,
    weight,
    sizeL,
    sizeW,
    sizeH,
    ftl,
    vehicleId,
    paymentType,
    freightCharges,
    hamali,
    surcharge,
    stCh,
    riskCh,
    unLoading,
    extraKms,
    detention,
    weightment,
    others,
    ewbNumber,
    ewbExpiryDate,
    totalAmt,
    emails,
    client,
  } = req.body;

  if (
    !lrNumber ||
    !date ||
    !from ||
    !to ||
    !insurance ||
    !consignorName ||
    !consignorGSTIN ||
    !consignorPincode ||
    !consignorAddress ||
    !consigneeName ||
    !consigneePincode ||
    !consigneeAddress ||
    !noOfPackages ||
    !methodOfPacking ||
    !description ||
    !weight ||
    !vehicleId ||
    !paymentType ||
    !client
  ) {
    res.status(400).json({
      message: "Invalid LR Details",
    });
    return;
  }
  try {
    const isLRNumberAvailable = await prisma.lR.findFirst({
      where: {
        lrNumber: lrNumber,
      },
    });
    if (isLRNumberAvailable) {
      res.status(201).json({
        message: "LR Number already exists",
      });
      return;
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
      },
    });

    const clients = await prisma.client.findUnique({
      where: {
        name: client,
      },
    });
    if (!clients) {
      res.status(400).json({
        message: "Invalid Client Id",
      });
      return;
    }

    await prisma.lR.create({
      data: {
        ...(adminId ? { adminId } : {}),
        ...(branchId ? { branchId } : {}),
        lrNumber,
        date,
        from,
        to,
        insurance,
        consignorName,
        consignorGSTIN,
        consignorPincode,
        consignorAddress,
        consigneeName,
        consigneeGSTIN,
        consigneePincode,
        consigneeAddress,
        noOfPackages,
        methodOfPacking,
        description,
        invoiceNo,
        invoiceDate,
        value,
        weight,
        sizeL,
        sizeW,
        sizeH,
        ftl,
        paymentType,
        freightCharges,
        hamali,
        surcharge,
        stCh,
        riskCh,
        unLoading,
        extraKms,
        detention,
        weightment,
        others,
        ewbNumber,
        ewbExpiryDate,
        totalAmt: parseFloat(totalAmt || "0"),
        emails,
        vehicleId: vehicle?.id,
        clientId: clients.id,
      },
    });
    await clearLRCache();
    res.status(200).json({
      message: "LR Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getLRData = async (req: Request, res: Response) => {
  try {
    const lrs = await prisma.lR.findMany({
      include: {
        Vehicle: true,
        branch: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        admin: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        pod: {
          select: {
            id: true,
          },
        },
        client: {
          select: {
            name: true,
            GSTIN: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    res.status(200).json({ data: lrs });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getLRByPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid LR Id",
    });
    return;
  }
  const skip = (page - 1) * limit;
  try {
    const data = await redisGetOrSetFunctions({
      key: `LR-data-${page}-${skip}`,
      fetchFunction: async () => {
        const LRCount = await prisma.lR.count();
        const LRData = await prisma.lR.findMany({
          skip,
          take: limit,
          orderBy: {
            date: "desc",
          },
          include: {
            Vehicle: true,
            branch: {
              select: {
                branchName: true,
                contactNumber: true,
                address: true,
                city: true,
                state: true,
                pincode: true,
              },
            },
            admin: {
              select: {
                branchName: true,
                contactNumber: true,
                address: true,
                city: true,
                state: true,
                pincode: true,
              },
            },
            pod: {
              select: {
                id: true,
              },
            },
            client: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          LRCount,
          LRData,
        };
      },
    });

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getLRByPageForBranch = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const branchId = req.query.branchId as string;

  if (!page || !limit || !branchId) {
    res.status(400).json({
      message: "Invalid LR Id",
    });
    return;
  }
  const skip = (page - 1) * limit;
  try {
    const LRCount = await prisma.lR.count({
      where: {
        branchId: branchId,
      },
    });
    const LRData = await prisma.lR.findMany({
      skip,
      take: limit,
      where: {
        branchId: branchId,
      },
      include: {
        Vehicle: true,
        branch: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        admin: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        pod: {
          select: {
            id: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const data = {
      LRCount,
      LRData,
    };

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getLRByLrNumber = async (req: Request, res: Response) => {
  const { lrNumber } = req.params;
  if (!lrNumber) {
    res.status(400).json({
      message: "Invalid LR Id",
    });
    return;
  }
  try {
    const lr = await prisma.lR.findUnique({
      where: {
        lrNumber,
      },
    });
    if (lr) {
      res.status(200).json({
        message: "LR Details",
        data: lr,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteLR = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid LR Id",
    });
    return;
  }
  try {
    const lr = await prisma.lR.findUnique({
      where: {
        id,
      },
    });
    if (lr) {
      await prisma.lR.delete({
        where: {
          id: lr.id,
        },
      });
      await clearLRCache();
      res.status(200).json({
        message: "LR Deleted",
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateLR = async (req: Request, res: Response) => {
  const {
    lrNumber,
    date,
    from,
    to,
    insurance,
    consignorName,
    consignorGSTIN,
    consignorPincode,
    consignorAddress,
    consigneeName,
    consigneeGSTIN,
    consigneePincode,
    consigneeAddress,
    noOfPackages,
    methodOfPacking,
    description,
    invoiceNo,
    invoiceDate,
    value,
    weight,
    sizeL,
    sizeW,
    sizeH,
    ftl,
    vehicleId,
    paymentType,
    freightCharges,
    hamali,
    surcharge,
    stCh,
    riskCh,
    unLoading,
    extraKms,
    detention,
    weightment,
    others,
    ewbNumber,
    ewbExpiryDate,
    totalAmt,
    emails,
    client,
  } = req.body;

  if (
    !lrNumber ||
    !date ||
    !from ||
    !to ||
    !insurance ||
    !consignorName ||
    !consignorGSTIN ||
    !consignorPincode ||
    !consignorAddress ||
    !consigneeName ||
    !consigneePincode ||
    !consigneeAddress ||
    !noOfPackages ||
    !methodOfPacking ||
    !description ||
    !weight ||
    !vehicleId ||
    !client
  ) {
    res.status(400).json({
      message: "Invalid LR Details",
    });
    return;
  }
  try {
    const lr = await prisma.lR.findUnique({
      where: {
        lrNumber,
      },
    });
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
      },
    });
    const clients = await prisma.client.findUnique({
      where: {
        name: client,
      },
    });
    if (!clients) {
      res.status(400).json({
        message: "Invalid Client Id",
      });
      return;
    }
    if (lr) {
      await prisma.lR.update({
        where: {
          id: lr.id,
        },
        data: {
          lrNumber,
          date,
          from,
          to,
          insurance,
          consignorName,
          consignorGSTIN,
          consignorPincode,
          consignorAddress,
          consigneeName,
          consigneeGSTIN,
          consigneePincode,
          consigneeAddress,
          noOfPackages,
          methodOfPacking,
          description,
          invoiceNo,
          invoiceDate,
          value,
          weight,
          sizeL,
          sizeW,
          sizeH,
          ftl,
          paymentType,
          freightCharges,
          hamali,
          surcharge,
          stCh,
          riskCh,
          unLoading,
          extraKms,
          detention,
          weightment,
          others,
          ewbNumber,
          ewbExpiryDate,
          totalAmt,
          emails,
          vehicleId: vehicle?.id,
          clientId: clients.id,
        },
      });
      await clearLRCache();
      res.status(200).json({
        message: "LR Updated",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterLRDetails = async (req: Request, res: Response) => {
  const { text } = req.params;

  try {
    const lrs = await prisma.lR.findMany({
      where: {
        OR: [
          { lrNumber: { contains: text, mode: "insensitive" } },
          { client: { name: { contains: text, mode: "insensitive" } } },
          { from: { contains: text, mode: "insensitive" } },
          { to: { contains: text, mode: "insensitive" } },
        ],
      },
      include: {
        Vehicle: true,
        branch: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        admin: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        pod: {
          select: {
            id: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    if (lrs) {
      res.status(200).json({
        message: "LR Details",
        data: lrs,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterLRDetailsForBranch = async (req: Request, res: Response) => {
  const { branchId, text } = req.params;

  try {
    const lrs = await prisma.lR.findMany({
      where: {
        branchId: branchId,
        OR: [
          { lrNumber: { contains: text, mode: "insensitive" } },
          { consignorName: { contains: text, mode: "insensitive" } },
          { consigneeName: { contains: text, mode: "insensitive" } },
        ],
      },
      include: {
        Vehicle: true,
        branch: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        admin: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        pod: {
          select: {
            id: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    if (lrs) {
      res.status(200).json({
        message: "LR Details",
        data: lrs,
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const sendLREmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  const LRData = JSON.parse(req.body.LrData);

  const subject = `Lorry Receipt for You Shipment - #${LRData.lrNumber}`;

  const bodyData: LRData = {
    lrNumber: LRData.lrNumber,
    body: LRData.mailBody,
    date: LRData.date,
    from: LRData.from,
    to: LRData.to,
    branchContactNumber:
      LRData.admin?.contactNumber || LRData.branch?.contactNumber,
    consignorName: LRData.consignorName,
    branchAddress: LRData.admin?.address || LRData.branch?.address,
    branchCity: LRData.admin?.city || LRData.branch?.city,
    branchPincode: LRData.admin?.pincode || LRData.branch?.pincode,
    consigneeName: LRData.consigneeName,
    noOfPackages: LRData.noOfPackages,
    description: LRData.description,
    vehicleNo: LRData.vehicleNo,
    driverPhone: LRData.driverPhone,
  };

  try {
    let attachments: any[] = [];

    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();

      attachments = files.map((file: Express.Multer.File) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }
    await sendLREmailToClient(
      email,
      subject,
      LREmailBody(bodyData),
      attachments
    );
    res.status(200).json({
      message: "LR Email Sent",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createFM = async (req: Request, res: Response) => {
  const {
    fmNumber,
    date,
    from,
    to,
    vehicleNo,
    vehicleType,
    weight,
    packages,
    vendorName,
    vendorEmail,
    ContactPerson,
    DriverName,
    contactNumber,
    ownerName,
    TDS,
    insturance,
    Rc,
    advance,
    hire,
    balance,
    otherCharges,
    detentionCharges,
    rtoCharges,
    tds,
    netBalance,
    amountInwords,
    dlNumber,
    driverSignature,
    LRDetails,
    adminId,
    branchId,
    payableAt,
    ftl,
    sizeL,
    sizeW,
    sizeH,
  } = req.body;

  try {
    const isFMNumberAvailable = await prisma.fM.findFirst({
      where: {
        fmNumber: fmNumber,
      },
    });
    if (isFMNumberAvailable) {
      res.status(201).json({
        message: "FM Number already exists",
      });
      return;
    }
    const vendor = await prisma.vendors.findUnique({
      where: {
        name: vendorName,
      },
    });
    if (!vendor) {
      res.status(400).json({
        message: "Invalid Vendor Id",
      });
      return;
    }
    const value =
      parseFloat(hire || "0") +
      parseFloat(otherCharges || "0") +
      parseFloat(detentionCharges || "0") +
      parseFloat(rtoCharges || "0");

    const finalValue = value - parseFloat(tds || "0");
    const fm = await prisma.fM.create({
      data: {
        fmNumber,
        date,
        from,
        to,
        vehicleNo,
        vehicleType,
        weight,
        package: packages,
        vendorEmail: vendorEmail,
        vendorName,
        ContactPerson,
        DriverName,
        contactNumber,
        ownerName,
        TDS,
        insturance,
        Rc,
        advance,
        hire,
        balance,
        otherCharges,
        detentionCharges,
        rtoCharges,
        tds,
        netBalance,
        payableAt,
        ftl,
        sizeL,
        sizeW,
        sizeH,
        outStandingBalance: finalValue.toString(),
        outStandingAdvance: advance ? parseFloat(advance || "0") : 0,
        amountInwords,
        dlNumber,
        driverSignature,
        LRDetails: LRDetails,
        Vendors: {
          connect: { id: vendor.id },
        },
        ...(adminId ? { admin: { connect: { id: adminId } } } : {}),
        ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      },
    });

    const updatedVendor = await prisma.vendors.update({
      where: {
        id: vendor.id,
      },
      data: {
        currentOutStanding: vendor.currentOutStanding + finalValue,
      },
    });
    if (updatedVendor?.currentOutStanding > updatedVendor?.outstandingLimit) {
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        res.status(400).json({
          message: "Invalid Admin Id",
        });
        return;
      }
      await prisma.notification.create({
        data: {
          adminId: admin.id,
          requestId: fm.id,
          title: "Outstanding limit",
          description: `The outstanding limit of INR ${updatedVendor.outstandingLimit} for the vendor ${updatedVendor.name} has reached. The current outstanding is INR ${updatedVendor.currentOutStanding}`,
          message: "",
          status: "one-time",
        },
      });
    }
    await clearFMCache();
    await clearVendorCache();
    res.status(200).json({
      message: "FM Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getFMData = async (req: Request, res: Response) => {
  try {
    const data = await prisma.fM.findMany({
      include: {
        PaymentRecords: {
          orderBy: {
            date: "desc",
          },
        },
        branch: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({ data: data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getFMByPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid LR Id",
    });
    return;
  }
  const skip = (page - 1) * limit;

  try {
    const data = await redisGetOrSetFunctions({
      key: `FM-data-${page}-${skip}`,
      fetchFunction: async () => {
        const FMCount = await prisma.fM.count();
        const FMData = await prisma.fM.findMany({
          skip,
          take: limit,
          orderBy: {
            date: "desc",
          },
          include: {
            PaymentRecords: true,
          },
        });
        return {
          FMCount,
          FMData,
        };
      },
    });

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getFMByPageForBranch = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const branchId = req.query.branchId as string;

  if (!page || !limit || !branchId) {
    res.status(400).json({
      message: "Invalid LR Id",
    });
    return;
  }
  const skip = (page - 1) * limit;
  try {
    const FMCount = await prisma.fM.count({
      where: {
        branchId: branchId,
      },
    });
    const FMData = await prisma.fM.findMany({
      skip,
      take: limit,
      where: {
        branchId: branchId,
      },
      include: {
        PaymentRecords: true,
      },
    });

    const data = {
      FMCount,
      FMData,
    };

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterFMDetails = async (req: Request, res: Response) => {
  const { text } = req.params;
  try {
    const fms = await prisma.fM.findMany({
      where: {
        OR: [
          { fmNumber: { contains: text, mode: "insensitive" } },
          { vendorName: { contains: text, mode: "insensitive" } },
        ],
      },
      include: {
        PaymentRecords: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (fms) {
      res.status(200).json({
        message: "FM Details",
        data: fms,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterFMDetailsForBranch = async (req: Request, res: Response) => {
  const { branchId, text } = req.params;

  try {
    const fms = await prisma.fM.findMany({
      where: {
        branchId: branchId,
        OR: [
          { fmNumber: { contains: text, mode: "insensitive" } },
          { vendorName: { contains: text, mode: "insensitive" } },
        ],
      },
      include: {
        PaymentRecords: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (fms) {
      res.status(200).json({
        message: "FM Details",
        data: fms,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteFM = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid FM Id",
    });
    return;
  }
  try {
    const fm = await prisma.fM.findUnique({
      where: {
        id,
      },
    });
    if (fm) {
      if (!fm.vendorsId) {
        res.status(202).json({
          message: "Invalid Vendor Id",
        });
        return;
      }
      const recordPayments = await prisma.paymentRecord.findMany({
        where: {
          fMId: fm.id,
        },
      });
      const vendor = await prisma.vendors.findUnique({
        where: {
          id: fm.vendorsId,
        },
      });

      const totalRecordPayments = recordPayments.reduce(
        (acc, data) => acc + parseFloat(data.amount || "0"),
        0
      );

      await prisma.vendors.update({
        where: {
          id: vendor?.id,
        },
        data: {
          currentOutStanding:
            (vendor?.currentOutStanding || 0) +
            totalRecordPayments -
            parseFloat(fm.balance || "0"),
        },
      });

      await prisma.fM.delete({
        where: {
          id: fm.id,
        },
      });
      await clearFMCache();
      res.status(200).json({
        message: "FM Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateFM = async (req: Request, res: Response) => {
  const {
    fmNumber,
    date,
    from,
    to,
    vehicleNo,
    vehicleType,
    weight,
    packages,
    vendorName,
    ContactPerson,
    DriverName,
    contactNumber,
    ownerName,
    TDS,
    insturance,
    Rc,
    advance,
    hire,
    balance,
    otherCharges,
    detentionCharges,
    rtoCharges,
    tds,
    netBalance,
    amountInwords,
    dlNumber,
    driverSignature,
    LRDetails,
    vendorsId,
    payableAt,
    ftl,
    sizeL,
    sizeW,
    sizeH,
  } = req.body;

  try {
    const fm = await prisma.fM.findUnique({
      where: {
        fmNumber,
      },
    });
    const vendor = await prisma.vendors.findUnique({
      where: {
        id: vendorsId,
      },
    });
    if (!vendor) {
      res.status(400).json({
        message: "Invalid Vendor Id",
      });
      return;
    }
    if (fm) {
      const value =
        parseFloat(hire || "0") +
        parseFloat(otherCharges || "0") +
        parseFloat(detentionCharges || "0") +
        parseFloat(rtoCharges || "0");

      const finalValue = value - parseFloat(tds || "0");
      const paidAmount =
        (fm.zeroToThirty || 0) +
        (fm.thirtyToSixty || 0) +
        (fm.sixtyToNinety || 0) +
        (fm.ninetyPlus || 0);
      const newOutstanding = finalValue - paidAmount;
      let newOutstandingAdvance = 0;
      if (paidAmount <= advance) {
        const remaining = advance - paidAmount;
        newOutstandingAdvance = remaining < 0 ? 0 : remaining;
      }

      await prisma.fM.update({
        where: {
          id: fm.id,
        },
        data: {
          fmNumber,
          date,
          from,
          to,
          vehicleNo,
          vehicleType,
          weight,
          package: packages,
          vendorName,
          ContactPerson,
          DriverName,
          contactNumber,
          ownerName,
          TDS,
          insturance,
          Rc,
          advance,
          hire,
          balance,
          otherCharges,
          detentionCharges,
          rtoCharges,
          tds,
          netBalance,
          payableAt,
          ftl,
          sizeL,
          sizeW,
          sizeH,
          outStandingBalance: newOutstanding.toString(),
          outStandingAdvance: newOutstandingAdvance,
          amountInwords,
          dlNumber,
          driverSignature,
          LRDetails,
        },
      });
      const oldValue =
        parseFloat(fm.hire || "0") +
        parseFloat(fm.otherCharges || "0") +
        parseFloat(fm.detentionCharges || "0") +
        parseFloat(fm.rtoCharges || "0");
      const finalOldValue = oldValue - parseFloat(fm.tds || "0");
      const oldOutstanding = vendor.currentOutStanding - finalOldValue;

      const updatedVendor = await prisma.vendors.update({
        where: {
          id: vendor.id,
        },
        data: {
          currentOutStanding: oldOutstanding + finalValue,
        },
      });
      if (updatedVendor?.currentOutStanding > updatedVendor?.outstandingLimit) {
        const admin = await prisma.admin.findFirst();
        if (!admin) {
          res.status(400).json({
            message: "Invalid Admin Id",
          });
          return;
        }
        await prisma.notification.create({
          data: {
            adminId: admin.id,
            requestId: fm.id,
            title: "Outstanding limit",
            description: `The outstanding limit of INR ${
              vendor.outstandingLimit
            } for the vendor ${
              vendor.name
            } has reached. The current outstanding is INR ${vendor.currentOutStanding.toFixed(
              2
            )}`,
            message: "",
            status: "one-time",
          },
        });
      }
      await clearFMCache();
      await clearVendorCache();
      res.status(200).json({
        message: "FM Updated",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const sendFMEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  const FMData = JSON.parse(req.body.FmData);

  const subject = `Freight Memo details for - #${FMData.fmNumber}`;

  const bodyData: FMData = {
    fmNumber: FMData.fmNumber,
    body: FMData.mailBody,
    date: FMData.date,
    from: FMData.from,
    to: FMData.to,
    vehicleNo: FMData.vehicleNo,
    driverName: FMData.DriverName,
    driverPhone: FMData.contactNumber,
    lrNumbers: FMData.LRDetails?.map((lr: any) => lr.lrNumber).toString(),
    totalAmt: FMData.amountInwords,
  };

  try {
    let attachments: any[] = [];

    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();

      attachments = files.map((file: Express.Multer.File) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }
    await sendFMEmailToClient(
      email,
      subject,
      FMEmailBody(bodyData),
      attachments
    );
    res.status(200).json({
      message: "FM Email Sent",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const addPaymentRecordToFM = async (req: Request, res: Response) => {
  const {
    date,
    customerName,
    amount,
    amountInWords,
    pendingAmount,
    transactionNumber,
    paymentMode,
    remarks,
    branchId,
    adminId,
    id,
  } = req.body;
  const { IDNumber } = req.params;

  if (
    !IDNumber ||
    !date ||
    !customerName ||
    !amount ||
    !amountInWords ||
    !transactionNumber ||
    !paymentMode ||
    !remarks
  ) {
    res.status(400).json({ message: "Invalid Payment Record Details" });
    return;
  }
  try {
    const fm = await prisma.fM.findUnique({
      where: { fmNumber: IDNumber },
    });

    if (!fm) {
      res.status(404).json({ message: "FM not found" });
      return;
    }

    if (id) {
      // 1. Fetch the existing payment record
      const existingRecord = await prisma.paymentRecord.findUnique({
        where: { id },
      });
      if (!existingRecord) {
        res.status(404).json({ message: "Payment record not found" });
        return;
      }
      // 2. Parse old & new amounts
      const prevAmount = parseFloat(existingRecord.amount || "0");
      const newAmount = parseFloat(amount || "0");
      const oldOutStandingBalance = parseFloat(fm.outStandingBalance || "0");
      const prevAdvanceOutstanding =
        parseFloat(existingRecord.amount || "0") + fm.outStandingAdvance;

      // 3. Find which bucket old record belonged to
      const prevDate = new Date(existingRecord.date);
      const prevDiff = prevDate.getTime() - new Date(fm.createdAt).getTime();

      let oldBucket:
        | "zeroToThirty"
        | "thirtyToSixty"
        | "sixtyToNinety"
        | "ninetyPlus";
      if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
        oldBucket = "zeroToThirty";
      } else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
        oldBucket = "thirtyToSixty";
      } else if (prevDiff < 90 * 24 * 60 * 60 * 1000) {
        oldBucket = "sixtyToNinety";
      } else {
        oldBucket = "ninetyPlus";
      }

      // 4. Subtract the previous amount from old bucket
      const oldAmount = Number(fm[oldBucket] || 0);
      const correctedOldAmount = oldAmount - prevAmount + newAmount;
      const newOutstanding = parseFloat(
        (oldOutStandingBalance + (prevAmount - newAmount)).toFixed(2)
      );
      const outstandingAdv = prevAdvanceOutstanding - parseFloat(amount);
      const FM = await prisma.fM.update({
        where: { id: fm.id },
        data: {
          [oldBucket]: correctedOldAmount,
          outStandingBalance: newOutstanding.toString(),
          outStandingAdvance: outstandingAdv < 0 ? 0 : outstandingAdv,
        },
      });

      await prisma.paymentRecord.update({
        where: { id },
        data: {
          IDNumber,
          date,
          customerName,
          amount,
          amountInWords,
          pendingAmount,
          transactionNumber,
          paymentMode,
          remarks,
        },
      });
      const vendor = await prisma.vendors.findUnique({
        where: {
          id: FM?.vendorsId!,
        },
      });

      const vendorCurrentOutstanding = vendor?.currentOutStanding!;
      const oldPaymentAmount = parseFloat(existingRecord.amount || "0");
      const updatedPaymentAmount = parseFloat(amount || "0");

      const newCurrentOutStanding =
        vendorCurrentOutstanding + oldPaymentAmount - updatedPaymentAmount;

      await prisma.vendors.update({
        where: {
          id: vendor?.id!,
        },
        data: {
          currentOutStanding: newCurrentOutStanding,
        },
      });
    } else {
      const newRecord = await prisma.paymentRecord.create({
        data: {
          IDNumber,
          date,
          customerName,
          amount,
          amountInWords,
          pendingAmount: parseFloat(pendingAmount),
          transactionNumber,
          paymentMode,
          remarks,
          fMId: fm.id,
          ...(adminId ? { adminId } : {}),
          ...(branchId ? { branchesId: branchId } : {}),
        },
      });

      const dateDiff =
        new Date(newRecord.date).getTime() - new Date(fm.createdAt).getTime();
      let settingTo:
        | "zeroToThirty"
        | "thirtyToSixty"
        | "sixtyToNinety"
        | "ninetyPlus";

      if (dateDiff < 30 * 24 * 60 * 60 * 1000) {
        settingTo = "zeroToThirty";
      } else if (dateDiff < 60 * 24 * 60 * 60 * 1000) {
        settingTo = "thirtyToSixty";
      } else if (dateDiff < 90 * 24 * 60 * 60 * 1000) {
        settingTo = "sixtyToNinety";
      } else {
        settingTo = "ninetyPlus";
      }

      const updatedAmount =
        ((fm[settingTo] as number) || 0) + parseFloat(newRecord.amount);
      const updatedAdvance = fm.outStandingAdvance - parseFloat(amount);
      const FM = await prisma.fM.update({
        where: { id: fm.id },
        data: {
          [settingTo]: updatedAmount,
          outStandingBalance: pendingAmount.toString(),
          outStandingAdvance: updatedAdvance < 0 ? 0 : updatedAdvance,
        },
      });
      const vendor = await prisma.vendors.findUnique({
        where: {
          id: FM?.vendorsId!,
        },
      });
      await prisma.vendors.update({
        where: {
          id: vendor?.id!,
        },
        data: {
          currentOutStanding:
            vendor?.currentOutStanding! - parseFloat(amount || "0"),
        },
      });
    }
    await clearGetAllRecordPaymentCache();
    await clearFMCache();
    await clearGetRecentTransactionCache();
    await clearVendorCache();
    res.status(200).json({ message: "Payment Record Added" });
  } catch (error) {
    console.error("Error adding payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const deletePaymentRecordFromFM = async (
  req: Request,
  res: Response
) => {
  const { id, IDNumber } = req.params;

  if (!id && !IDNumber) {
    res.status(400).json({ message: "Invalid Payment Record Id" });
    return;
  }

  try {
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id },
    });
    if (paymentRecord) {
      const fm = await prisma.fM.findUnique({
        where: { fmNumber: IDNumber },
      });
      if (!fm) {
        res.status(404).json({ message: "FM not found" });
        return;
      }
      const recordDate = new Date(paymentRecord.date);
      const createdAt = new Date(fm.createdAt);
      const diff = recordDate.getTime() - createdAt.getTime();

      let bucket:
        | "zeroToThirty"
        | "thirtyToSixty"
        | "sixtyToNinety"
        | "ninetyPlus";

      if (diff < 30 * 24 * 60 * 60 * 1000) {
        bucket = "zeroToThirty";
      } else if (diff < 60 * 24 * 60 * 60 * 1000) {
        bucket = "thirtyToSixty";
      } else if (diff < 90 * 24 * 60 * 60 * 1000) {
        bucket = "sixtyToNinety";
      } else {
        bucket = "ninetyPlus";
      }

      const bucketAmount = Number(fm[bucket] || 0);
      const correctedBucketAmount =
        bucketAmount - parseFloat(paymentRecord.amount || "0");
      const updatedOutstanding =
        parseFloat(fm.outStandingBalance || "0") +
        parseFloat(paymentRecord.amount || "0");

      let advanceBalance =
        fm.outStandingAdvance + parseFloat(paymentRecord.amount || "0");

      if(advanceBalance > parseFloat(fm.advance || "0")){
        advanceBalance = parseFloat(fm.advance || "0");
      } 
      

      await prisma.fM.update({
        where: { id: fm.id },
        data: {
          [bucket]: correctedBucketAmount,
          outStandingBalance: updatedOutstanding.toString(),
          outStandingAdvance: advanceBalance,
        },
      });
      await prisma.paymentRecord.delete({
        where: { id },
      });

      const vendor = await prisma.vendors.findUnique({
        where: {
          id: fm.vendorsId!,
        },
      });
      if (!vendor) return;
      await prisma.vendors.update({
        where: {
          id: vendor.id,
        },
        data: {
          currentOutStanding:
            vendor.currentOutStanding - parseFloat(paymentRecord.amount || "0"),
        },
      });
      await clearGetAllRecordPaymentCache();
      await clearFMCache();
      await clearGetRecentTransactionCache();
      await clearVendorCache();
      res.status(200).json({ message: "Payment Record Deleted" });
      return;
    }
  } catch (error) {
    console.error("Error deleting payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const filterFMBymonth = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    res.status(400).json({ message: "Invalid Date Range" });
    return;
  }
  try {
    const fms = await prisma.fM.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        PaymentRecords: true,
      },
    });
    if (fms) {
      res.status(200).json({
        message: "FM Details",
        data: fms,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};
export const filterFMBymonthForBranch = async (req: Request, res: Response) => {
  const { branchId } = req.params;
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    res.status(400).json({ message: "Invalid Date Range" });
    return;
  }
  try {
    const fms = await prisma.fM.findMany({
      where: {
        branchId: branchId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        PaymentRecords: true,
      },
    });
    if (fms) {
      res.status(200).json({
        message: "FM Details",
        data: fms,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getFMByBranchId = async (req: Request, res: Response) => {
  const { branchId } = req.params;
  if (!branchId) {
    res.status(400).json({
      message: "Invalid Branch Id",
    });
    return;
  }
  try {
    const FMs = await prisma.fM.findMany({
      where: {
        branchId: branchId,
      },
      include: {
        PaymentRecords: true,
      },
    });
    if (FMs) {
      res.status(200).json({
        message: "FM Details",
        data: FMs,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getLRByBranchId = async (req: Request, res: Response) => {
  const { branchId } = req.params;
  if (!branchId) {
    res.status(400).json({
      message: "Invalid Branch Id",
    });
    return;
  }
  try {
    const LRs = await prisma.lR.findMany({
      where: {
        branchId: branchId,
      },
      include: {
        Vehicle: true,
        branch: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        admin: {
          select: {
            branchName: true,
            contactNumber: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
      },
    });
    if (LRs) {
      res.status(200).json({
        message: "LR Details",
        data: LRs,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateLRByNotification = async (req: Request, res: Response) => {
  const { data, lrNumber } = req.body;

  if (!lrNumber) {
    res.status(400).json({
      message: "Invalid LR Id",
    });
    return;
  }
  try {
    const lr = await prisma.lR.findUnique({
      where: {
        lrNumber: lrNumber,
      },
    });
    if (lr) {
      if (data.data.client) {
        const client = await prisma.client.findUnique({
          where: {
            name: data.data.client,
          },
        });
        if (client) {
          data.data.client = {
            connect: { id: client.id },
          };
        }
      }
      const updated = await prisma.lR.update({
        where: {
          id: lr.id,
        },
        data: {
          ...data.data,
        },
      });
      if (updated) {
        await prisma.notification.create({
          data: {
            branchesId: lr.branchId,
            requestId: lr.lrNumber,
            title: "LR",
            status: "approved",
            description: "Approved",
          },
        });
      }
    } else {
      res.status(400).json({
        message: "LR Updated failed",
      });
      return;
    }
    await clearLRCache();
    res.status(200).json({
      message: "LR Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateFMByNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    date,
    from,
    to,
    vehicleNo,
    vehicleType,
    weight,
    packages,
    vendorName,
    ContactPerson,
    DriverName,
    contactNumber,
    ownerName,
    TDS,
    insturance,
    Rc,
    advance,
    hire,
    balance,
    otherCharges,
    detentionCharges,
    rtoCharges,
    tds,
    netBalance,
    amountInwords,
    dlNumber,
    driverSignature,
    LRDetails,
    payableAt,
    ftl,
    sizeL,
    sizeW,
    sizeH,
  } = req.body;

  try {
    const fm = await prisma.fM.findUnique({
      where: {
        fmNumber: id,
      },
    });
    const vendor = await prisma.vendors.findUnique({
      where: {
        id: fm?.vendorsId!,
      },
    });
    if (!vendor) {
      res.status(400).json({
        message: "Invalid Vendor Id",
      });
      return;
    }
    if (fm) {
      const value =
        parseFloat(hire || "0") +
        parseFloat(otherCharges || "0") +
        parseFloat(detentionCharges || "0") +
        parseFloat(rtoCharges || "0");

      const finalValue = value - parseFloat(tds || "0");
      const paidAmount =
        (fm.zeroToThirty || 0) +
        (fm.thirtyToSixty || 0) +
        (fm.sixtyToNinety || 0) +
        (fm.ninetyPlus || 0);
      const newOutstanding = finalValue - paidAmount;
      let newOutstandingAdvance = 0;
      if (paidAmount <= advance) {
        const remaining = advance - paidAmount;
        newOutstandingAdvance = remaining < 0 ? 0 : remaining;
      }

      await prisma.fM.update({
        where: {
          id: fm.id,
        },
        data: {
          date,
          from,
          to,
          vehicleNo,
          vehicleType,
          weight,
          package: packages,
          vendorName,
          ContactPerson,
          DriverName,
          contactNumber,
          ownerName,
          TDS,
          insturance,
          Rc,
          advance,
          hire,
          balance,
          otherCharges,
          detentionCharges,
          rtoCharges,
          tds,
          netBalance,
          payableAt,
          ftl,
          sizeL,
          sizeW,
          sizeH,
          outStandingBalance: newOutstanding.toString(),
          outStandingAdvance: newOutstandingAdvance,
          amountInwords,
          dlNumber,
          driverSignature,
          LRDetails,
        },
      });
      const oldValue =
        parseFloat(fm.hire || "0") +
        parseFloat(fm.otherCharges || "0") +
        parseFloat(fm.detentionCharges || "0") +
        parseFloat(fm.rtoCharges || "0");
      const finalOldValue = oldValue - parseFloat(fm.tds || "0");
      const oldOutstanding = vendor.currentOutStanding - finalOldValue;

      const updatedVendor = await prisma.vendors.update({
        where: {
          id: vendor.id,
        },
        data: {
          currentOutStanding: oldOutstanding + finalValue,
        },
      });
      if (updatedVendor?.currentOutStanding > updatedVendor?.outstandingLimit) {
        const admin = await prisma.admin.findFirst();
        if (!admin) {
          res.status(400).json({
            message: "Invalid Admin Id",
          });
          return;
        }
        await prisma.notification.create({
          data: {
            adminId: admin.id,
            requestId: fm.id,
            title: "Outstanding limit",
            description: `The outstanding limit of INR ${
              vendor.outstandingLimit
            } for the vendor ${
              vendor.name
            } has reached. The current outstanding is INR ${vendor.currentOutStanding.toFixed(
              2
            )}`,
            message: "",
            status: "one-time",
          },
        });
      }
    }
    await clearFMCache();
    res.status(200).json({
      message: "FM Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteFMByNotification = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const fm = await prisma.fM.findUnique({
      where: {
        fmNumber: id,
      },
    });
    if (fm) {
      const updated = await prisma.fM.delete({
        where: {
          id: fm.id,
        },
      });
      if (updated) {
        await prisma.notification.create({
          data: {
            branchesId: fm.branchId,
            requestId: fm.fmNumber,
            title: "FM",
            status: "deleted",
            description: "deleted",
          },
        });
      }
    } else {
      res.status(400).json({
        message: "FM Deleted failed",
      });
      return;
    }
    await clearFMCache();
    res.status(200).json({
      message: "FM Deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteLRByNotification = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    const lr = await prisma.lR.findUnique({
      where: {
        lrNumber: id,
      },
    });
    if (lr) {
      const updated = await prisma.lR.delete({
        where: {
          id: lr.id,
        },
      });
      if (updated) {
        await prisma.notification.create({
          data: {
            branchesId: lr.branchId,
            requestId: lr.lrNumber,
            title: "LR",
            status: "deleted",
            description: "deleted",
          },
        });
      }
    } else {
      res.status(400).json({
        message: "LR Deleted failed",
      });
      return;
    }
    await clearLRCache();
    res.status(200).json({
      message: "LR Deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateRecordPaymentByNotification = async (
  req: Request,
  res: Response
) => {
  const { id, LRnumber } = req.params;
  const { data } = req.body;

  if (!id) {
    res.status(400).json({
      message: "Invalid Payment Record Id",
    });
    return;
  }
  try {
    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: { id },
    });
    const FM = await prisma.fM.findUnique({
      where: { fmNumber: LRnumber },
    });
    if (!paymentRecord) {
      res.status(404).json({
        message: "Payment Record not found",
      });
      return;
    }
    if (!FM) {
      res.status(404).json({
        message: "FM not found",
      });
      return;
    }
    if (data.amount) {
      const prevAmount = parseFloat(paymentRecord.amount || "0");
      const newAmount = parseFloat(data.amount || "0");
      const oldOutStandingBalance = parseFloat(FM.outStandingBalance || "0");

      const prevDate = new Date(paymentRecord.date);
      const prevDiff = prevDate.getTime() - new Date(FM.createdAt).getTime();

      let oldBucket:
        | "zeroToThirty"
        | "thirtyToSixty"
        | "sixtyToNinety"
        | "ninetyPlus";
      if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
        oldBucket = "zeroToThirty";
      } else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
        oldBucket = "thirtyToSixty";
      } else if (prevDiff < 90 * 24 * 60 * 60 * 1000) {
        oldBucket = "sixtyToNinety";
      } else {
        oldBucket = "ninetyPlus";
      }

      // 4. Subtract the previous amount from old bucket
      const oldAmount = Number(FM[oldBucket] || 0);
      const correctedOldAmount = oldAmount - prevAmount + newAmount;
      const newOutstanding = parseFloat(
        (oldOutStandingBalance + (prevAmount - newAmount)).toFixed(2)
      );

      await prisma.fM.update({
        where: { id: FM.id },
        data: {
          [oldBucket]: correctedOldAmount,
          outStandingBalance: newOutstanding.toString(),
        },
      });

      if (!FM.vendorsId) return;
      const vendor = await prisma.vendors.findUnique({
        where: {
          id: FM.vendorsId,
        },
      });
      if (!vendor) return;
      await prisma.vendors.update({
        where: {
          id: vendor.id,
        },
        data: {
          currentOutStanding:
            vendor.currentOutStanding - prevAmount + newAmount,
        },
      });
    }

    await prisma.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        ...data,
      },
    });

    await prisma.notification.create({
      data: {
        branchesId: FM.branchId,
        requestId: FM.fmNumber,
        title: "FM record",
        status: "Approved",
        description: "Approved",
      },
    });
    await clearGetAllRecordPaymentCache();
    await clearFMCache();
    await clearGetRecentTransactionCache();
    await clearVendorCache();
    res.status(200).json({
      message: "Payment Record Updated",
    });
  } catch (error) {
    console.error("Error adding payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const deleteFMRecordByNotification = async (
  req: Request,
  res: Response
) => {
  const { id, IDNumber } = req.params;

  if (!id && !IDNumber) {
    res.status(400).json({ message: "Invalid Payment Record Id" });
    return;
  }

  try {
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id },
    });
    if (paymentRecord) {
      const fm = await prisma.fM.findUnique({
        where: { fmNumber: IDNumber },
      });
      if (!fm) {
        res.status(404).json({ message: "FM not found" });
        return;
      }
      const recordDate = new Date(paymentRecord.date);
      const createdAt = new Date(fm.createdAt);
      const diff = recordDate.getTime() - createdAt.getTime();

      let bucket:
        | "zeroToThirty"
        | "thirtyToSixty"
        | "sixtyToNinety"
        | "ninetyPlus";

      if (diff < 30 * 24 * 60 * 60 * 1000) {
        bucket = "zeroToThirty";
      } else if (diff < 60 * 24 * 60 * 60 * 1000) {
        bucket = "thirtyToSixty";
      } else if (diff < 90 * 24 * 60 * 60 * 1000) {
        bucket = "sixtyToNinety";
      } else {
        bucket = "ninetyPlus";
      }

      const bucketAmount = Number(fm[bucket] || 0);
      const correctedBucketAmount =
        bucketAmount - parseFloat(paymentRecord.amount || "0");
      const updatedOutstanding =
        parseFloat(fm.outStandingBalance || "0") +
        parseFloat(paymentRecord.amount || "0");
      await prisma.fM.update({
        where: { id: fm.id },
        data: {
          [bucket]: correctedBucketAmount,
          outStandingBalance: updatedOutstanding.toString(),
        },
      });
      await prisma.paymentRecord.delete({
        where: { id },
      });

      const vendor = await prisma.vendors.findUnique({
        where: {
          id: fm.vendorsId!,
        },
      });
      if (!vendor) return;
      await prisma.vendors.update({
        where: {
          id: vendor.id,
        },
        data: {
          currentOutStanding:
            vendor.currentOutStanding - parseFloat(paymentRecord.amount || "0"),
        },
      });

      await prisma.notification.create({
        data: {
          branchesId: fm.branchId,
          requestId: fm.fmNumber,
          title: "FM record",
          status: "Approved",
          description: "Approved",
        },
      });
      await clearGetAllRecordPaymentCache();
      await clearFMCache();
      await clearGetRecentTransactionCache();
      await clearVendorCache();
      res.status(200).json({ message: "Payment Record Deleted" });
      return;
    }
    res.status(400).json({ message: "FM record delete failed" });
  } catch (error) {
    console.error("Error adding payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};
