import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <div className="max-w-2xl flex flex-col gap-6 text-center">
        <h1 className="text-xl font-medium text-foreground">
          Welcome, <span className="text-gray-600">{user?.firstName}!</span>
        </h1>
        <div className="flex flex-col gap-4">
          <p className="text-base leading-relaxed">
            Feather is your intelligent research companion, designed to help you
            organize and explore your research in powerful new ways.{" "}
            <span className="text-gray-500 italic text-xs">
              (Press ⌘ + J to open sidebar)
            </span>
          </p>
          <p className="text-base leading-relaxed">
            Upload your research papers in the{" "}
            <span className="font-medium text-gray-600">Library</span>, write
            your papers in the{" "}
            <span className="font-medium text-gray-600">Editor</span>, and
            control AI features in{" "}
            <span className="font-medium text-gray-600">Settings</span>.
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              We're currently in beta and value your feedback! Reach out at{" "}
              <a
                href="mailto:dhruvb26@asu.edu"
                className="text-gray-600 hover:text-gray-700 hover:underline transition-colors"
              >
                dhruvb26@asu.edu
              </a>
              {" or "}
              <a
                href="mailto:kgupta72@asu.edu"
                className="text-gray-600 hover:text-gray-700 hover:underline transition-colors"
              >
                kgupta72@asu.edu
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
