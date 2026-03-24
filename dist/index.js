"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const admin_1 = __importDefault(require("./router/admin"));
const branch_1 = __importDefault(require("./router/branch"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const partner_1 = __importDefault(require("./router/partner"));
const shipment_1 = require("./controller/shipment");
const shipment_2 = __importDefault(require("./router/shipment"));
const billing_1 = __importDefault(require("./router/billing"));
const billing_2 = require("./controller/billing");
const settings_1 = __importDefault(require("./router/settings"));
const fileUpload_1 = require("./controller/fileUpload");
const pod_1 = __importDefault(require("./router/pod"));
const expenses_1 = __importDefault(require("./router/expenses"));
const node_cron_1 = __importDefault(require("node-cron"));
const pod_2 = require("./controller/pod");
const writeoff_1 = __importDefault(require("./router/writeoff"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use("/api/v1", admin_1.default);
app.use("/api/v1", branch_1.default);
app.use("/api/v1", partner_1.default);
app.use("/api/v1", shipment_2.default);
app.use("/api/v1", billing_1.default);
app.use("/api/v1", settings_1.default);
app.use("/api/v1", pod_1.default);
app.use("/api/v1", expenses_1.default);
app.use("/api/v1", writeoff_1.default);
app.post("/api/v1/sendLREmail/:email", upload.any(), shipment_1.sendLREmail);
app.post("/api/v1/sendFMEmail/:email", upload.any(), shipment_1.sendFMEmail);
app.post("/api/v1/sendBillEmail/:email", upload.any(), billing_2.sendBillEmail);
app.post("/api/v1/lorryReceiptsUpload", upload.any(), fileUpload_1.lorryReceiptsFileUpload);
// createAdmin()
// async function deleteUnUsedPOD() {
//   const LR = await prisma.lR.findMany({
//     include: {
//       pod: true
//     }
//   })
//   const filterLR = LR.filter((lr) => lr.pod.length == 0)
//   console.log(filterLR.length);
//   filterLR.forEach(async (lr) => {
//     const oldlr = await prisma.lR.update({
//       where: {
//         id: lr.id
//       },
//       data: {
//         pod: {
//           set: []
//         }
//       }
//     })
//     console.log(oldlr.lrNumber);
//   })
// }
// deleteUnUsedPOD()
node_cron_1.default.schedule("0 0 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🔄 Running FM status checker at midnight...");
    yield (0, pod_2.checkPaymentForStatusChange)();
}));
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
