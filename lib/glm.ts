export async function analyzeImageWithGLM(
  imageBase64: string,
  mimeType: string,
  userText: string,
  systemContext: string,
): Promise<string> {
  const apiKey = process.env.GLM_API_KEY;
  const baseUrl =
    process.env.GLM_API_URL ?? "https://open.bigmodel.cn/api/paas/v4";
  const model = process.env.GLM_VISION_MODEL ?? "glm-4v-flash";

  if (!apiKey) {
    throw new Error("未配置 GLM_API_KEY");
  }

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemContext,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text",
              text:
                userText ||
                "请描述这张图片的内容，并给出温暖、自然的回应（作为陪伴者视角）。",
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 320,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GLM Vision API 错误: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("GLM 返回内容为空");
  return content;
}
