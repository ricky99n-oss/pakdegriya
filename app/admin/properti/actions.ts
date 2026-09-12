"use server";
import { db } from "../../../db";
import { properties } from "../../../db/schema";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function createProperty(formData: FormData) {
  // Mengambil data dari form
  const code = formData.get("code") as string;
  const slug = formData.get("slug") as string;
  const title = formData.get("title") as string;
  const price = Number(formData.get("price")); // Konversi ke angka
  const transactionType = formData.get("transactionType") as "jual" | "sewa_bulan" | "sewa_tahun";
  const propertyType = formData.get("propertyType") as "rumah" | "tanah" | "villa" | "ruko" | "apartemen";
  const generalLocation = formData.get("generalLocation") as string;

  // Insert ke database
  await db.insert(properties).values({
    id: crypto.randomUUID(),
    code,
    slug,
    title,
    price,
    transactionType,
    propertyType,
    generalLocation,
    publishStatus: "draft", // Default selalu draft agar aman
    availabilityStatus: "available",
  });

  // Kembali ke halaman daftar properti
  redirect("/admin/properti");
}