const axios = require("axios");

module.exports.sendMsg = async function (msg, type = "") {
  const body = await buildCard(msg);
  const LARK_URL = process.env[type ? `LARK_WEBHOOK_URL_${type.toUpperCase()}` : "LARK_WEBHOOK_URL"];

  console.log("sendMessage to ", LARK_URL);
  console.log("card body", body);

  return axios.post(LARK_URL, body);
};

// 組合卡片 body 元素
function buildBodyElements(message) {
  const elements = [
    // {
    //   tag: "div",
    //   element_id: "time",
    //   text: {
    //     tag: "lark_md",
    //     content:
    //       "**Time** **<local_datetime format_type='date_num'></local_datetime> <local_datetime format_type='time_sec'></local_datetime> (<local_datetime format_type='timezone'></local_datetime>)**",
    //   },
    // },
    // {
    //   tag: "hr",
    // },
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
async function buildCard(message) {
  const bodyElements = buildBodyElements(message);
  const secondLine = message.split('\n')[1];
  const fourthLine = message.split('\n')[3];
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
      header: {
        title: {
          tag: "lark_md",
          content: fourthLine + ` (${secondLine})`,
        },
        subtitle: {
          tag: "lark_md",
          content: "<local_datetime format_type='date_num'></local_datetime> <local_datetime format_type='time_sec'></local_datetime> (<local_datetime format_type='timezone'></local_datetime>)",
        },
        template: "wathet",
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

