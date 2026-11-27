/* 全国47都道府県対応の地域企業紹介。掲載企業は確認・許可が完了したものだけ登録する。 */
(function () {
  "use strict";

  const PREFECTURES = [
    "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
    "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
    "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
    "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
    "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
    "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
    "熊本県","大分県","宮崎県","鹿児島県","沖縄県"
  ];

  /*
   * 登録データの形式：
   * {
   *   id, name, prefecture, cities: [], category, description,
   *   phone, website, verified: true, permission: true, status: "published",
   *   wastePermitVerified: true（家庭ごみ回収を扱う場合は必須）
   * }
   * verified・permission・status の条件を満たさない企業は表示しない。
   */
  const COMPANIES = [];

  const SERVICE_BY_GUIDE = {
    leak: { category: "plumbing", label: "水道修理・水漏れ対応" },
    gasstove: { category: "gas-appliance", label: "ガス機器・コンロの点検や修理" },
    cleaning: { category: "cleaning", label: "ハウスクリーニング" },
    security: { category: "locksmith", label: "鍵・防犯サービス" },
    waste: { category: "waste-management", label: "不用品・粗大ごみの処分" },
    movingservice: { category: "moving", label: "引っ越しサービス" }
  };

  function safeExternalUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function addText(parent, tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }

  function render(guideId, resultCard) {
    const service = SERVICE_BY_GUIDE[guideId];
    if (!service || !resultCard) return;

    const section = document.createElement("section");
    section.className = "local-company-section";
    section.setAttribute("aria-labelledby", "localCompanyTitle");

    addText(section, "h4", "local-company-heading", service.label + "の相談先を探す");
    addText(section, "p", "local-company-description",
      "必要に応じて、お住まいの都道府県で相談先を確認できます。掲載企業は情報と掲載許可を確認した事業者に限ります。");

    const label = document.createElement("label");
    label.className = "local-company-label";
    label.htmlFor = "localCompanyPrefecture-" + guideId;
    label.textContent = "都道府県を選択";
    section.appendChild(label);

    const select = document.createElement("select");
    select.id = "localCompanyPrefecture-" + guideId;
    select.className = "local-company-select";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "都道府県を選んでください";
    select.appendChild(placeholder);
    PREFECTURES.forEach((prefecture) => {
      const option = document.createElement("option");
      option.value = prefecture;
      option.textContent = prefecture;
      select.appendChild(option);
    });

    let saved = "";
    try { saved = localStorage.getItem("kurashi-selected-prefecture") || ""; } catch (_) {}
    if (PREFECTURES.includes(saved)) select.value = saved;
    section.appendChild(select);

    const results = document.createElement("div");
    results.className = "local-company-results";
    results.setAttribute("aria-live", "polite");
    section.appendChild(results);

    function updateResults() {
      results.replaceChildren();
      const prefecture = select.value;
      if (!prefecture) {
        addText(results, "p", "local-company-empty", "都道府県を選択すると、対応する掲載企業を確認できます。");
        return;
      }
      try { localStorage.setItem("kurashi-selected-prefecture", prefecture); } catch (_) {}

      const matches = COMPANIES.filter((company) =>
        company.prefecture === prefecture &&
        company.category === service.category &&
        company.verified === true &&
        company.permission === true &&
        company.status === "published" &&
        (company.category !== "waste-management" || company.wastePermitVerified === true)
      );

      if (!matches.length) {
        addText(results, "p", "local-company-empty",
          prefecture + "では、現在この分野の掲載条件を確認できた企業はありません。自治体や契約先の公式窓口もご確認ください。");
        return;
      }

      matches.forEach((company) => {
        const card = document.createElement("article");
        card.className = "local-company-card";
        addText(card, "h5", "", company.name);
        if (company.description) addText(card, "p", "", company.description);
        if (Array.isArray(company.cities) && company.cities.length) {
          addText(card, "p", "local-company-meta", "対応地域：" + company.cities.join("・"));
        }
        if (company.phone && /^[0-9+()-]+$/.test(company.phone)) {
          const phone = document.createElement("a");
          phone.href = "tel:" + company.phone.replace(/[^0-9+]/g, "");
          phone.textContent = "電話で問い合わせる";
          phone.className = "local-company-link";
          card.appendChild(phone);
        }
        const website = safeExternalUrl(company.website);
        if (website) {
          const link = document.createElement("a");
          link.href = website;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "公式サイトを見る ↗";
          link.className = "local-company-link";
          card.appendChild(link);
        }
        addText(card, "p", "local-company-disclosure", "掲載情報は確認時点のものです。依頼前に対応内容・料金・受付状況をご確認ください。");
        results.appendChild(card);
      });
    }

    select.addEventListener("change", updateResults);
    updateResults();
    resultCard.appendChild(section);
  }

  window.renderLocalCompanySection = render;
})();
