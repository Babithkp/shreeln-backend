import { Request, Response } from "express";import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const createVendor = async (req: Request, res: Response) => {
  const {
    name,
    GSTIN,
    contactPerson,
    contactNumber,
    address,
    TDS,
    city,
    state,
    pincode,
    email,
    pan,
    outstandingLimit,
  } = req.body;
  if (
    !name ||
    !contactPerson ||
    !contactNumber ||
    !address ||
    !TDS ||
    !city ||
    !state ||
    !pincode ||
    !pan ||
    !outstandingLimit
  ) {
    res.status(400).json({
      message: "Invalid Vendor Details",
    });
    return;
  }
  try {
    const admin = await prisma.admin.findFirst();
    const isVendorNameAvailable = await prisma.vendors.findFirst({
      where: {
        name: name,
      },
    });
    if (isVendorNameAvailable) {
      res.status(201).json({
        message: "Vendor Name already exists",
      });
      return;
    }
    if (admin) {
      await prisma.vendors.create({
        data: {
          name,
          GSTIN,
          contactPerson,
          contactNumber,
          address,
          TDS,
          city,
          state,
          pincode,
          email,
          pan,
          outstandingLimit: parseFloat(outstandingLimit),
          adminId: admin?.id,
        },
      });
      res.status(200).json({
        message: "Vendor Created",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendors.findMany({
      include: {
        vehicles: {
          include: {
            LR: true,
          },
        },
        FM: {
          include: {
            PaymentRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({ data: vendors });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateVendorDetails = async (req: Request, res: Response) => {
  const {
    name,
    GSTIN,
    contactPerson,
    contactNumber,
    address,
    TDS,
    city,
    state,
    pincode,
    email,
    pan,
    outstandingLimit,
  } = req.body;
  const { id } = req.params;

  if (
    !id ||
    !name ||
    !contactPerson ||
    !contactNumber ||
    !address ||
    !TDS ||
    !city ||
    !state ||
    !pincode ||
    !pan ||
    !outstandingLimit
  ) {
    res.status(400).json({
      message: "Invalid Vendor Details",
    });
    return;
  }
  try {
    const vendor = await prisma.vendors.findUnique({
      where: {
        id,
      },
    });
    if (vendor) {
      if (vendor.name !== name) {
        const isVendorNameAvailable = await prisma.vendors.findFirst({
          where: {
            name: name,
          },
        });
        if (isVendorNameAvailable) {
          res.status(201).json({
            message: "Vendor Name already exists, please try another one",
          });
          return;
        }
      }
      await prisma.vendors.update({
        where: {
          id: vendor.id,
        },
        data: {
          name,
          GSTIN,
          contactPerson,
          contactNumber,
          address,
          TDS,
          city,
          pan,
          state,
          pincode,
          email,
          outstandingLimit: parseFloat(outstandingLimit || "0"),
        },
      });
      res.status(200).json({
        message: "Vendor Updated",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Vendor Id",
    });
    return;
  }
  try {
    const vendor = await prisma.vendors.findUnique({
      where: {
        id,
      },
    });
    if (vendor) {
      await prisma.vendors.delete({
        where: {
          id: vendor.id,
        },
      });
      res.status(200).json({
        message: "Vendor Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  const {
    vendorName,
    vehicletypes,
    vehicleNumber,
    ownerName,
    ownerPhone,
    driverName,
    driverPhone,
    insurance,
    RC,
    panNumber,
  } = req.body;
  if (
    !vehicletypes ||
    !vehicleNumber ||
    !insurance ||
    !RC ||
    !panNumber ||
    !driverPhone
  ) {
    res.status(400).json({
      message: "Invalid Vehicle Details",
    });
    return;
  }
  try {
    const vendor = await prisma.vendors.findUnique({
      where: {
        name: vendorName,
      },
    });
    if (vendor) {
      await prisma.vehicle.create({
        data: {
          vendorName,
          vehicletypes,
          vehicleNumber,
          ownerName,
          ownerPhone,
          driverName,
          driverPhone,
          insurance,
          RC,
          panNumber,
          vendorId: vendor.id,
        },
      });
      res.status(200).json({
        message: "Vehicle Created",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.status(200).json({ data: vehicles });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      message: "Invalid Vehicle Details",
    });
    return;
  }
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
      },
      include: {
        vendor: true,
      },
    });
    if (vehicle) {
      res.status(200).json({ data: vehicle });
    } else {
      res.status(400).json({
        message: "Invalid Vehicle Details",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateVehicleDetails = async (req: Request, res: Response) => {
  const {
    vendorName,
    vehicletypes,
    vehicleNumber,
    ownerName,
    ownerPhone,
    driverName,
    driverPhone,
    insurance,
    RC,
  } = req.body;
  const { id } = req.params;
  if (
    !id ||
    !vendorName ||
    !vehicletypes ||
    !vehicleNumber ||
    !ownerName ||
    !ownerPhone ||
    !driverPhone ||
    !insurance ||
    !RC
  ) {
    res.status(400).json({
      message: "Invalid Vehicle Details",
    });
    return;
  }
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id,
      },
    });
    if (vehicle) {
      await prisma.vehicle.update({
        where: {
          id: vehicle.id,
        },
        data: {
          vendorName,
          vehicletypes,
          vehicleNumber,
          ownerName,
          ownerPhone,
          driverName,
          driverPhone,
          insurance,
          RC,
        },
      });
      res.status(200).json({
        message: "Vehicle Updated",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Vehicle Id",
    });
    return;
  }
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id,
      },
    });
    if (vehicle) {
      await prisma.vehicle.delete({
        where: {
          id: vehicle.id,
        },
      });
      res.status(200).json({
        message: "Vehicle Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getBillLRForClient = async (req: Request, res: Response) => {
  const { name, from, to } = req.body;

  try {
    const client = await prisma.client.findUnique({
      where: { name },
    });

    if (!client) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    const dateFilter: any = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    const bills = await prisma.bill.findMany({
      where: {
        clientId: client.id,
        ...(from || to ? { date: dateFilter } : {}),
      },
      include: {
        lrData: {
          select: {
            lrNumber: true,
            from: true,
            to: true,
            totalAmt: true,
          },
        },
      },
    });

    const LRs = await prisma.lR.findMany({
      where: {
        clientId: client.id,
      },
      include: {
        Vehicle: {
          select: {
            vehicleNumber: true,
          },
        },
      },
    });

    const data = {
      bills,
      LRs: LRs.filter((lr) => lr.billId == null),
    };

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterFMLRByVendor = async (req: Request, res: Response) => {
  const { name, from, to } = req.body;
  const { branchId } = req.params;

  try {
    const vendor = await prisma.vendors.findUnique({
      where: { name },
    });

    if (!vendor) {
      res.status(404).json({ message: "Vendor not found" });
      return;
    }

    const FMs = await prisma.fM.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        vendorName: vendor.name,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
    });
    const lrNumbers = FMs.flatMap((fm) =>
      fm.LRDetails.map((lr) => lr.lrNumber)
    );

    const LRs = await prisma.lR.findMany({
      where: {
        lrNumber: {
          in: lrNumbers,
        },
      },
      include: {
        Vehicle: {
          select: {
            vehicleNumber: true,
          },
        },
        pod: true,
      },
    });

    const data = {
      FMs,
      LRs: LRs.filter((lr) => lr.pod.length == 0),
    };

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getVendorForPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid Vendor Id",
    });
    return;
  }

  try {
    const skip = (page - 1) * limit;
    const totalVendors = await prisma.vendors.count();

    const vendorData = await prisma.vendors.findMany({
      skip,
      take: limit,
      include: {
        vehicles: {
          include: {
            LR: true,
          },
        },
        FM: {
          include: {
            PaymentRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = {
      vendorCount: totalVendors,
      vendorData,
    };

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterVendorByName = async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    const vendor = await prisma.vendors.findMany({
      where: {
        OR: [
          { name: { contains: name, mode: "insensitive" } },
          { contactPerson: { contains: name, mode: "insensitive" } },
        ],
      },
      include: {
        vehicles: {
          include: {
            LR: true,
          },
        },
        FM: {
          include: {
            PaymentRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (vendor) {
      res.status(200).json({
        message: "Vendor Details",
        data: vendor,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getClientForPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid Client Id",
    });
    return;
  }

  try {
    const skip = (page - 1) * limit;
    const totalClients = await prisma.client.count();

    const clientData = await prisma.client.findMany({
      skip,
      take: limit,
      include: {
        bill: {
          include: {
            PaymentRecords: true,
          },
        },
        LR: {
          include: {
            Vehicle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = {
      clientCount: totalClients,
      clientData,
    };

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterClientByName = async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    const client = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: name, mode: "insensitive" } },
          { city: { contains: name, mode: "insensitive" } },
          { contactPerson: { contains: name, mode: "insensitive" } },
        ],
      },
      include: {
        bill: {
          include: {
            PaymentRecords: true,
          },
        },
        LR: {
          include: {
            Vehicle: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (client) {
      res.status(200).json({
        message: "Client Details",
        data: client,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};
