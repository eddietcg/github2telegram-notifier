const axios = require("axios");

module.exports.sendMsg = async function (msg, type) {
  const body = await buildCard(msg);
  const LARK_URL = process.env[`LARK_WEBHOOK_URL_${type.toUpperCase()}`];

  console.log("sendMessage to ", LARK_URL);
  console.log("card body", body);

  return axios.post(LARK_URL, body);
};

/**
 * Lark Card Builder - 動態組合 Lark 卡片 JSON 並直接發送到 Webhook
 *
 * 使用方式:
 *   node build-lark-card.js [options]
 *
 * 環境變數:
 *   LARK_WEBHOOK_URL  必需，Lark Bot Webhook 的完整 URL
 *
 * CLI 參數 (所有參數必需):
 *   --state=VALUE          構建狀態：SUCCESS, FAILURE, FAILED, UNSTABLE (預設: SUCCESS)
 *   --job-name=VALUE       Jenkins Job 名稱 (必需)
 *   --build-user=VALUE     構建觸發者名稱 (必需)
 *   --build-number=VALUE   構建編號 (若為空則從 build-url 提取)
 *   --branch=VALUE         Git 分支名稱 (必需)
 *   --tcg-web-view=VALUE
 *   --target=VALUE         部署目標環境 (必需)
 *   --dev-build=VALUE      DEV 構建編號 (必需)
 *   --build-url=VALUE      Jenkins Job URL，用於提取構建編號和卡片連結 (必需)
 *   --sql-list=VALUE
 *   --swagger-url=VALUE
 *   --wps-version=VALUE
 *   --message=VALUE
 *
 * 範例:
 *   export LARK_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
 *   node build-lark-card.js \
 *     --state=SUCCESS \
 *     --job-name="TCG Build Job" \
 *     --build-user="eddie" \
 *     --build-number=123 \
 *     --branch=main \
 *     --target=SIT1 \
 *     --dev-build=456 \
 *     --sql-list=123.lst \
 *     --build-url="http://jenkins.example.com/job/tcg-build/123/"
 *     --message="Build succeeded!\n test"
 */

// 發送卡片到 Lark Webhook
async function sendToLark(payload) {
  const webhookUrl = process.env.LARK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("LARK_WEBHOOK_URL environment variable is required");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return { status: response.status };
}

// 從 URL 提取 build number
function extractBuildNumber(jobUrl) {
  if (!jobUrl) return null;
  // 提取 URL 最後的數字，例如 http://jenkins/job/123/ → 123
  const match = jobUrl.match(/(\d+)\/?$/);
  return match ? match[1] : null;
}

// 根據狀態返回對應的表情、顏色、文字
function getStatusConfig(params) {
  const { state } = params;
  const stateUpper = String(state).toUpperCase();

  const config = {
    SUCCESS: {
      emoji: ":CheckMark:",
      color: "turquoise",
      text: "Succeeded",
    },
    FAILURE: {
      emoji: ":ANGRY:",
      color: "red",
      text: "Failed",
    },
    FAILED: {
      emoji: ":ANGRY:",
      color: "red",
      text: "Failed",
    },
    UNSTABLE: {
      emoji: ":Fire:",
      color: "orange",
      text: "Unstable",
    },
    WARNING: {
      emoji: ":Fire:",
      color: "orange",
      text: "Warning",
    },
  };

  return config[stateUpper] || config.SUCCESS;
}

// 組合卡片 body 元素
function buildBodyElements(message) {
  const elements = [
    {
      tag: "div",
      element_id: "time",
      text: {
        tag: "lark_md",
        content:
          "**Time** **<local_datetime format_type='date_num'></local_datetime> <local_datetime format_type='time_sec'></local_datetime> (<local_datetime format_type='timezone'></local_datetime>)**",
      },
    },
    {
      tag: "hr",
    },
  ];

  // 其他資訊
  elements.push(
    ...[
      message
        ? {
          tag: "div",
          element_id: "message",
          text: {
            tag: "lark_md",
            content: message.replace(/\\n/g, "\n"),
          },
        }
        : null,
    ].filter(Boolean)
  );

  return elements;
}

// 主函式：組合完整的 Lark 卡片 JSON
async function buildCard(msg) {
  const bodyElements = buildBodyElements(msg);
  return {
    msg_type: "interactive",
    card: {
      schema: "2.0",
      config: {
        update_multi: true,
      },
      card_link: {
        url: null,
      },
      body: {
        direction: "vertical",
        padding: "12px 8px 12px 8px",
        vertical_spacing: "8px",
        elements: bodyElements,
      },
    },
  };
}

