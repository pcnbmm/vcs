import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from "@react-pdf/renderer";

// Register font ภาษาไทย
Font.register({
    family: "Sarabun",
    fonts: [
        { src: "/fonts/Sarabun-Regular.ttf", fontWeight: "normal" },
        { src: "/fonts/Sarabun-Bold.ttf", fontWeight: "bold" },
    ],
});

const styles = StyleSheet.create({
    page: {
        fontFamily: "Sarabun",
        fontSize: 10,
        padding: 40,
        backgroundColor: "#ffffff",
        lineHeight: 1.4, // Add line height for better Thai character rendering
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16,
    },
    section: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#d1d5db",
    },
    sectionHeader: {
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
    },
    sectionHeaderText: {
        fontWeight: "bold",
        fontSize: 10,
    },
    row: {
        flexDirection: "row",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        flexWrap: "nowrap", // Ensure row doesn't wrap
    },
    label: {
        width: 230, // เพิ่มจาก 180 → 210
        fontWeight: "bold",
        color: "#374151",
        paddingRight: 8,
        flexShrink: 0,
    },
    value: {
        flex: 1,
        color: "#111827",
        flexWrap: "wrap",
    },
    radioRow: {
        flexDirection: "row",
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    radioLabel: {
        width: 230, // เพิ่มจาก 180 → 210
        fontWeight: "bold",
        color: "#374151",
    },
    radioOptions: {
        flexDirection: "row",
        flex: 1,
        flexWrap: "wrap",
        columnGap: 10,
        rowGap: 4,
    },
    radioItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    radioCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#374151",
    },
    radioCircleFilled: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#374151",
        backgroundColor: "#374151",
    },
    radioText: {
        fontSize: 9,
    },
});

// Helper components
const SectionBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
        {children}
    </View>
);

const PDFRow = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
);

const getStatusName = (status: string) => {
    if (status === "1") return "รออนุมัติ";
    if (status === "2" || status === "5") return "อนุมัติแล้ว";
    if (status === "3") return "ไม่อนุมัติ";
    if (status === "4") return "กำลังใช้งาน";
    if (status === "6") return "ยกเลิกคำขอ";
    return "-";
};

const radioOptions = [
    { label: "อนุมัติ" },
    { label: "อนุมัติ(ผู้ขอขับเอง)" },
    { label: "อนุมัติ(TAXI)" },
    { label: "ไม่อนุมัติ" },
];

interface BookingPDFProps {
    request: {
        id: string;
        requester: string;
        department: string;
        phone: string;
        date: string;
        time: string;
        endDate: string;
        endTime: string;
        origin: string;
        destination: string;
        objective: string;
        passengers: number;
        carType: string;
        selfDrive: string;
        status: string;
        approver?: string | null;
        dispatcher?: string | null;
        pickupMethod?: string | null;
        selfDriveBool?: boolean;
        requesterUsername?: string | null;
        approverUsername?: string | null;
        dispatcherUsername?: string | null;
    };
}

export default function BookingPDF({ request }: BookingPDFProps) {
    const isSelected = (optLabel: string) => {
        const status = String(request.status);
        const isApproved = status === "2" || status === "4" || status === "5";
        const isRejected = status === "3" || status === "6";

        if (optLabel === "อนุมัติ") {
            return (status === "2" || status === "5") && request.pickupMethod !== "TAXI";
        }
        if (optLabel === "อนุมัติ(ผู้ขอขับเอง)") {
            return isApproved && request.selfDriveBool === true;
        }
        if (optLabel === "อนุมัติ(TAXI)") {
            return request.pickupMethod === "TAXI";
        }
        if (optLabel === "ไม่อนุมัติ") {
            return isRejected;
        }
        return false;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Title */}
                <Text style={styles.title}>บันทึกการขอใช้งานรถยนต์</Text>

                {/* Section 1 */}
                <SectionBox title="ส่วนการขอใช้งานรถยนต์">
                    <PDFRow label="ผู้ขอใช้" value={`${request.requesterUsername ?? request.id} - ${request.requester}`} />
                    <PDFRow label="สังกัดผู้ขอใช้งาน" value={request.department} />
                    <PDFRow label="หมายเลขโทรศัพท์" value={request.phone} />
                    <PDFRow label="วันเดินทางไป" value={`${request.date} เวลา ${request.time} น.`} />
                    <PDFRow label="วันเดินทางกลับ" value={`${request.endDate} เวลา ${request.endTime} น.`} />
                    <PDFRow label="สถานที่ (ต้นทาง)" value={request.origin} />
                    <PDFRow label="สถานที่ (ปลายทาง)" value={request.destination} />
                    <PDFRow label="เหตุผลในการขอใช้รถ" value={request.objective} />
                    <PDFRow label="จำนวนผู้เดินทาง " value={`${request.passengers} คน`} />
                    <PDFRow label="ประเภทรถ" value={request.carType} />
                    <PDFRow label="ประเภทการขับ" value={request.selfDrive} />
                </SectionBox>

                {/* Section 2 */}
                <SectionBox title="ส่วนการอนุมัติ">
                    <PDFRow label="ผู้อนุมัติ" value={request.approverUsername ? `${request.approverUsername} - ${request.approver}` : (request.approver || "-")} />
                </SectionBox>

                {/* Section 3 */}
                <SectionBox title="ส่วนการจัดการข้อมูลการขอใช้งานรถยนต์">
                    {/* Radio buttons สถานะ */}
                    <View style={styles.radioRow}>
                        <Text style={styles.radioLabel}>สถานะ</Text>
                        <View style={styles.radioOptions}>
                            {radioOptions.map((opt) => (
                                <View key={opt.label} style={styles.radioItem}>
                                    <View
                                        style={
                                            isSelected(opt.label)
                                                ? styles.radioCircleFilled
                                                : styles.radioCircle
                                        }
                                    />
                                    <Text style={styles.radioText}>{opt.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <PDFRow label="เวลาออกเดินทาง" value={`${request.time} น.`} />
                    <PDFRow label="สถานการณ์ขอใช้งาน" value={getStatusName(request.status)} />
                    <PDFRow label="ผู้ดำเนินการ " value={request.dispatcherUsername ? `${request.dispatcherUsername} - ${request.dispatcher}` : (request.dispatcher || "-")} />
                </SectionBox>
            </Page>
        </Document>
    );
}