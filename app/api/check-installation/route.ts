import { auth } from "@/lib/auth";
import { checkAppInstalled } from "@/lib/github-app";
import { NextResponse } from "next/server";

/**
 * Endpoint para verificar si el usuario tiene la GitHub App instalada
 * GET /api/check-installation
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.access_token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const isInstalled = await checkAppInstalled(session.access_token);

    return NextResponse.json({
      installed: isInstalled,
      message: isInstalled 
        ? "GitHub App instalada correctamente" 
        : "GitHub App no instalada"
    });
  } catch (error) {
    console.error("Error checking installation:", error);
    return NextResponse.json(
      { error: "Error al verificar la instalación" },
      { status: 500 }
    );
  }
}
