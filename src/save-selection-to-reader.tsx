import { showToast, Toast, getSelectedText, LaunchProps } from "@raycast/api";
import { marked } from "marked";
import { saveToReader } from "./utils";

interface CommandArguments {
  url: string;
}

export default async function Command(props: LaunchProps<{ arguments: CommandArguments }>) {
  const abortController = new AbortController();

  try {
    const selectedText = await getSelectedText();

    if (!selectedText || selectedText.trim() === "") {
      await showToast(Toast.Style.Failure, "No text selected", "Please select some text first");
      return;
    }

    const { url } = props.arguments;

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Saving to Reader...",
      primaryAction: {
        title: "Cancel",
        onAction: () => {
          abortController.abort();
          toast.hide();
        },
      },
    });

    // Convert selected text to HTML
    const html = await marked(selectedText);

    // Use selected text first line as title, or "Selected Text"
    const title = selectedText.split("\n")[0].substring(0, 100) || "Selected Text";

    await saveToReader(html, title, url, abortController.signal);

    await showToast(Toast.Style.Success, "Successfully saved to Reader");
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      await showToast(Toast.Style.Failure, "Operation cancelled");
      return;
    }
    await showToast(Toast.Style.Failure, "Save failed", String(e));
  }
}
