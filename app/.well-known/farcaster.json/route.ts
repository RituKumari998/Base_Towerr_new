import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // {
      "accountAssociation": {
        "header": "eyJmaWQiOjI2ODAwOSwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDYxNDI1NjlEMjQ2MTQ2MkE0MkY5N2Q2ZWM4NzBBNUEzMTk2RTc5NzQifQ",
        "payload": "eyJkb21haW4iOiJiYXNlLXRvd2VyLnZlcmNlbC5hcHAifQ",
        "signature": "9MVgsJX2UlQa1LNcVuNiEh/OwIH/PtXtY7bJJvGXMl9X2Gtgguy62z7VFZ/BN958YzcFQkKDR2fKgOkCCA8hDBs="
      },
    
    
    frame: {
      version: "1",
      name: "Base Block",
      iconUrl: `${APP_URL}/images/icon.jpg`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.jpg`,
      screenshotUrls: [],
      tags: ["base", "farcaster", "miniapp", "games"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: "#fafafa",
      webhookUrl: `${APP_URL}/api/webhook`,
          subtitle: "Base Block",
      description: "Play and Earn",
      tagline:"Play and Earn",
      ogTitle:"Base Block",
      ogDescription: "Play and Earn",
      ogImageUrl: `${APP_URL}/images/feed.jpg`,
      heroImageUrl: `${APP_URL}/images/feed.jpg`,
      requiredChains: ["eip155:8453"],
    },
    // "baseBuilder": {
    //   "allowedAddresses": ["0x3C9d2436B3a4cAc62FBcfBA95903C391b3DFD002"]
    // }
  };

  return NextResponse.json(farcasterConfig);
}
