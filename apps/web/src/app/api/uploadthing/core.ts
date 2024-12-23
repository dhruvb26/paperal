import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getUser } from "@/app/actions/user";
import { db } from "@/db";
import { libraryTable } from "@/db/schema";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({
    pdf: {
      maxFileSize: "64MB",
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await getUser();

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      // console.log("user id", user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // TODO: uncomment this
      // await db.insert(libraryTable).values({
      //   title: "Proving Test Set Contamination in Black Box Language Models",
      //   userId: metadata.userId,
      //   metadata: {
      //     fileUrl: file.url,
      //     authors: [
      //       "Yonatan Oren",
      //       "Nicole Meister",
      //       "Niladri Chatterji",
      //       "Faisal Ladhak",
      //       "Tatsunori B. Hashimoto",
      //     ],
      //     year: 2023,
      //     citations: {
      //       "in-text": "(Oren et al., 2023)",
      //       "after-text": `Oren, Y., Meister, N., Chatterji, N., Ladhak, F., & Hashimoto, T. B. (2023). Proving test set contamination in black box language models. ${file.url}`,
      //     },
      //   },
      // });

      console.log("file url", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
