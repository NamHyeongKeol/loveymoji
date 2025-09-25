import { serverApi } from "@/lib/trpc/server";
import { UploadScreen } from "@/components/upload/upload-screen";

export const dynamic = "force-dynamic";

export default async function Home() {
  const uploads = await serverApi.upload.all();

  return <UploadScreen initialUploads={uploads} />;
}
