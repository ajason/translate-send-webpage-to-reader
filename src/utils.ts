import { getPreferenceValues } from "@raycast/api";
import fetch from "node-fetch";

export interface Preferences {
  readwiseToken: string;
  autoTranslate: boolean;
  targetLanguage: string;
  aiModel: string;
}

export async function saveToReader(html: string, title: string, url: string, signal?: AbortSignal) {
  const { readwiseToken } = getPreferenceValues<Preferences>();

  try {
    const response = await fetch("https://readwise.io/api/v3/save/", {
      method: "POST",
      signal,
      headers: {
        Authorization: `Token ${readwiseToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        html: html,
        title,
        should_clean_html: true,
        location: "later",
        category: "article",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Request failed: ${response.status} ${response.statusText}\n${errorData}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    console.error("API Error:", error);
    throw error;
  }
}
