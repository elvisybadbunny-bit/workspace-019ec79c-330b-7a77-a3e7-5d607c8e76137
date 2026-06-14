/**
 * G.10 Document Set — Student ID Card PDF.
 * Compact, branded (primary color, motto) and QR-verified.
 * Designed to fit on an A7 card size (74 x 105 mm), printable and fits in standard badges.
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export interface StudentIdCard {
  schoolName: string;
  motto: string | null;
  county: string | null;
  addressLine: string | null;
  brandPrimary: string;
  studentName: string;
  admissionNo: string;
  className: string;
  photoUrl: string | null;
  verifyCode: string;
  qrDataUrl: string;
}

const GREEN = "#1f9d5f";
const MUTED = "#677fab";

export async function renderStudentIdCardsPdf(cards: StudentIdCard[]): Promise<Buffer> {
  const doc = (
    <Document>
      {cards.map((c, i) => {
        const NAVY = c.brandPrimary || "#1c2740";
        const s = StyleSheet.create({
          // A7 = 74 x 105 mm
          page: {
            padding: 12,
            fontSize: 8,
            color: NAVY,
            fontFamily: "Helvetica",
            backgroundColor: "#ffffff",
          },
          cardBorder: {
            borderWidth: 1.5,
            borderColor: NAVY,
            borderRadius: 8,
            padding: 10,
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
          },
          header: {
            borderBottomWidth: 1.5,
            borderBottomColor: NAVY,
            paddingBottom: 4,
            marginBottom: 6,
            textAlign: "center",
          },
          school: {
            fontSize: 10,
            fontFamily: "Helvetica-Bold",
          },
          motto: {
            fontSize: 5.5,
            color: GREEN,
            marginTop: 1,
            fontFamily: "Helvetica-Oblique",
          },
          addr: {
            fontSize: 5,
            color: MUTED,
            marginTop: 0.5,
          },
          body: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flex: 1,
          },
          photoCol: {
            width: 50,
            height: 60,
            borderWidth: 1,
            borderColor: "#dbe3f0",
            borderRadius: 4,
            backgroundColor: "#f7f9fc",
            justifyContent: "center",
            alignItems: "center",
          },
          photo: {
            width: "100%",
            height: "100%",
            borderRadius: 3,
          },
          initials: {
            fontSize: 14,
            fontFamily: "Helvetica-Bold",
            color: MUTED,
          },
          infoCol: {
            flex: 1,
            justifyContent: "center",
          },
          idLabel: {
            fontSize: 5.5,
            color: MUTED,
            letterSpacing: 0.5,
          },
          name: {
            fontSize: 9,
            fontFamily: "Helvetica-Bold",
            marginBottom: 2,
            color: NAVY,
          },
          metaRow: {
            marginTop: 2,
          },
          metaText: {
            fontSize: 6.5,
            color: "#333",
            marginBottom: 1,
          },
          bold: {
            fontFamily: "Helvetica-Bold",
          },
          footer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopColor: "#eef2f6",
            paddingTop: 4,
            marginTop: 6,
          },
          qr: {
            width: 32,
            height: 32,
          },
          ftextCol: {
            flex: 1,
            marginLeft: 6,
          },
          badgeType: {
            fontSize: 6,
            fontFamily: "Helvetica-Bold",
            color: GREEN,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          },
          verify: {
            fontSize: 5,
            color: MUTED,
            marginTop: 1,
          },
        });

        const initials = c.studentName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")
          .toUpperCase();

        return (
          <Page key={i} size="A7" style={s.page}>
            <View style={s.cardBorder}>
              <View style={s.header}>
                <Text style={s.school}>{c.schoolName}</Text>
                {c.motto ? <Text style={s.motto}>{c.motto}</Text> : null}
                <Text style={s.addr}>
                  {[c.addressLine, c.county].filter(Boolean).join(" · ") || "Kenya"}
                </Text>
              </View>

              <View style={s.body}>
                <View style={s.photoCol}>
                  {c.photoUrl ? (
                    <Image style={s.photo} src={c.photoUrl} />
                  ) : (
                    <Text style={s.initials}>{initials}</Text>
                  )}
                </View>

                <View style={s.infoCol}>
                  <Text style={s.idLabel}>STUDENT ID CARD</Text>
                  <Text style={s.name}>{c.studentName}</Text>
                  <View style={s.metaRow}>
                    <Text style={s.metaText}>
                      Adm No: <Text style={s.bold}>{c.admissionNo}</Text>
                    </Text>
                    <Text style={s.metaText}>
                      Class: <Text style={s.bold}>{c.className}</Text>
                    </Text>
                    <Text style={s.metaText}>
                      Status: <Text style={[s.bold, { color: GREEN }]}>ACTIVE</Text>
                    </Text>
                  </View>
                </View>
              </View>

              <View style={s.footer}>
                <Image style={s.qr} src={c.qrDataUrl} />
                <View style={s.ftextCol}>
                  <Text style={s.badgeType}>Official Student ID</Text>
                  <Text style={s.verify}>NEYO Verified · Ref: {c.verifyCode}</Text>
                </View>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
  return renderToBuffer(doc);
}
