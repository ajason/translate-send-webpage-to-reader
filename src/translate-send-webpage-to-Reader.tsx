import { showToast, Toast, getPreferenceValues, AI, BrowserExtension } from "@raycast/api";
import { marked } from "marked";
import { saveToReader, Preferences } from "./utils";

async function translateToLanguage(
  text: string,
  language: string,
  model: string,
  signal?: AbortSignal,
): Promise<string> {
  const prompt = `请将网页中的文章的所有内容一字不漏地翻译成简体${language}，并且确保对中文读者读起来是通顺的。
                  人名要保持原文，专有名词则要中英对照（以不影响可读性为主）。
                  不需要翻译链接、代码。
                  请不要因为内容很长就分段翻译。我要你一次一口气全部翻译完成，不用担心输出的内容太长，绝对不要遗漏任何一句话。 
                  只输出文章的翻译结果，使用 markdown 格式。
                  文章：${text}`;
  return await AI.ask(prompt, {
    model: model as AI.Model,
    signal,
  });
}

export default async function Command() {
  const abortController = new AbortController();

  try {
    const { autoTranslate, targetLanguage, aiModel } = getPreferenceValues<Preferences>();
    const content = await BrowserExtension.getContent({ format: "markdown" });
    const tabs = await BrowserExtension.getTabs();
    const activeTab = tabs.find((tab) => tab.active);
    const url = activeTab?.url || "";
    const title = activeTab?.title || "";

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Processing...",
      primaryAction: {
        title: "Cancel",
        onAction: () => {
          abortController.abort();
          toast.hide();
        },
      },
    });

    let finalContent = content;
    if (autoTranslate) {
      finalContent = await translateToLanguage(content, targetLanguage, aiModel, abortController.signal);
    }
    const html = await marked(finalContent);

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
