const axios = require("axios");

module.exports.sendMsg = async function (msg, type) {
  const body = await buildCard(msg);
  const LARK_URL = process.env[`LARK_WEBHOOK_URL_${type.toUpperCase()}`];

  console.log("sendMessage to ", LARK_URL);
  console.log("card body", body);

  return axios.post(LARK_URL, body);
};

// 組合卡片 body 元素
function buildBodyElements(message) {
  const fourthLine = message.split('\n')[3];
  const elements = [
    {
      tag: "div",
      element_id: "header",
      text: {
        tag: "lark_md",
        content: fourthLine,
      },
    },
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
            content: message,
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

