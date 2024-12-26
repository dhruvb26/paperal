import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getUser } from "@/app/actions/user";
import { createLibraryEmbeddings } from "@/trigger/library-embeddings";
import { tasks } from "@trigger.dev/sdk/v3";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({
    pdf: {
      maxFileSize: "64MB",
    },
  })
    .middleware(async ({ req }) => {
      const user = await getUser();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const research_urls = [file.url];

      await tasks.trigger<typeof createLibraryEmbeddings>(
        "create-library-embeddings",
        {
          research_urls,
          user_id: metadata.userId,
        }
      );

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
