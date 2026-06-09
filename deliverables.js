(function () {
  let lastContract = "";

  const n = (v) => {
    const x = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(x) ? x : 0;
  };
  const money = (v) => `${n(v).toLocaleString("es-ES", { maximumFractionDigits: 2 })} EUR`;
  const pct = (v) => `${n(v).toLocaleString("es-ES", { maximumFractionDigits: 1 })}%`;
  const data = () => Object.fromEntries(new FormData(document.querySelector("#slaForm")).entries());

  function calc(raw) {
    const gmv = n(raw.precioVenta) * n(raw.volumen);
    const comision = gmv * n(raw.comision) / 100;
    const fee = n(raw.feeMarketing);
    const baseProveedor = n(raw.costeProveedor) * n(raw.volumen);
    const floatFin = baseProveedor * n(raw.diasPago) / 30;
    const checks = [
      ["Lead time entrada", n(raw.targetLead), n(raw.realLead), n(raw.realLead) <= n(raw.targetLead), "dias"],
      ["Entrega cliente", n(raw.targetEntrega), n(raw.realEntrega), n(raw.realEntrega) <= n(raw.targetEntrega), "dias"],
      ["Aceptacion pedido", n(raw.targetAceptacion), n(raw.realAceptacion), n(raw.realAceptacion) <= n(raw.targetAceptacion), "horas"],
      ["Disponibilidad stock", n(raw.targetStock), n(raw.realStock), n(raw.realStock) >= n(raw.targetStock), "%"],
      ["Tasa devoluciones", n(raw.targetDevoluciones), n(raw.realDevoluciones), n(raw.realDevoluciones) <= n(raw.targetDevoluciones), "%"],
      ["Respuesta incidencias", n(raw.targetIncidencias), n(raw.realIncidencias), n(raw.realIncidencias) <= n(raw.targetIncidencias), "horas"],
      ["Rating cliente", n(raw.targetRating), n(raw.realRating), n(raw.realRating) >= n(raw.targetRating), "sobre 5"]
    ];
    const cumplimiento = checks.filter((check) => check[3]).length / checks.length;
    const cumpleTodo = cumplimiento === 1;
    const penalRetraso = n(raw.realEntrega) > n(raw.targetEntrega) ? comision * n(raw.penalRetrasos) / 100 : 0;
    const penalStock = n(raw.realStock) < n(raw.targetStock) ? n(raw.penalStock) : 0;
    const bono = cumpleTodo ? gmv * n(raw.bonoTotal) / 100 : 0;
    const ingresoNeto = comision + fee - penalRetraso - penalStock + bono;
    const riesgoSla = cumplimiento < 0.85 ? "ALTO" : "CONTROLADO";
    const riesgoFin = n(raw.diasPago) > 45 ? "ALTO" : "CONTROLADO";
    const riesgoCliente = n(raw.realRating) < n(raw.targetRating) || n(raw.realDevoluciones) > n(raw.targetDevoluciones) ? "ALTO" : "CONTROLADO";
    const decision = riesgoSla === "ALTO" || riesgoFin === "ALTO" || riesgoCliente === "ALTO" ? "REVISAR" : "GO";
    return { gmv, comision, fee, floatFin, checks, cumplimiento, penalRetraso, penalStock, bono, ingresoNeto, riesgoSla, riesgoFin, riesgoCliente, decision };
  }

  function clauses(raw) {
    return [
      ["Partes", `${raw.proveedor} opera en ${raw.marketplace} bajo modelo ${raw.modelo}.`],
      ["Pago al proveedor", `El marketplace liquidara al proveedor a ${raw.diasPago} dias. Este plazo condiciona el margen financiero y el capital circulante.`],
      ["Comision y marketing", `La comision variable pactada es del ${raw.comision}% sobre ventas, mas un fee de marketing de ${money(raw.feeMarketing)} mensuales.`],
      ["Ficha de producto", `La responsabilidad sobre el alta, contenido y mantenimiento de la ficha corresponde a ${raw.respFicha}.`],
      ["Gestion del pedido", `La gestion operativa del pedido sera asumida por ${raw.respPedido} y podra canalizarse mediante portal o app: ${raw.usoPortal}.`],
      ["Logistica y alcance", `La logistica sera responsabilidad de ${raw.respLogistica} con alcance declarado: ${raw.alcanceEntrega}.`],
      ["Devoluciones e incidencias", `Las devoluciones seran gestionadas por ${raw.respDevoluciones} y las incidencias por ${raw.respIncidencias}.`],
      ["Lead time y entrega", `Se exige un lead time de entrada de ${raw.targetLead} dias y una entrega al cliente en ${raw.targetEntrega} dias como maximo.`],
      ["Servicio al cliente", `La aceptacion del pedido debera producirse en ${raw.targetAceptacion} horas, con respuesta a incidencias en ${raw.targetIncidencias} horas y rating minimo de ${raw.targetRating}/5.`],
      ["Penalizaciones e incentivos", `Penalizacion por retrasos ${raw.penalRetrasos}% sobre comision, penalizacion stock ${money(raw.penalStock)} y bono ${raw.bonoTotal}% del GMV si cumple todo.`],
      ["Datos e IA", `Prediccion de demanda: ${raw.prediccion}. Scoring proveedor: ${raw.scoring}. Alertas preventivas: ${raw.alertas}.`]
    ];
  }

  function table(headers, rows) {
    return `<table class="sla-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  function metrics(items) {
    return `<section class="metric-grid">${items.map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`).join("")}</section>`;
  }

  function riskCard(title, status, text) {
    const cls = status === "GO" || status === "CONTROLADO" ? "status-ok" : "status-bad";
    return `<article class="risk-card"><span>${title}</span><strong class="${cls}">${status}</strong><p>${text}</p></article>`;
  }

  function renderContract(raw, c) {
    return `
      <article class="contract-paper">
        <header class="contract-doc-head">
          <span>Documento simulado para practica</span>
          <h3>Acuerdo SLA Marketplace</h3>
          <p>Contrato base generado automaticamente para revisar condiciones, responsabilidades, niveles de servicio, penalizaciones e incentivos antes de una firma simulada.</p>
        </header>
        <section class="contract-summary">
          <article><span>Proveedor</span><strong>${raw.proveedor}</strong></article>
          <article><span>Marketplace</span><strong>${raw.marketplace}</strong></article>
          <article><span>Modelo</span><strong>${raw.modelo}</strong></article>
          <article><span>Decision</span><strong>${c.decision}</strong></article>
        </section>
        <section class="contract-clauses">
          ${clauses(raw).map(([title, text], i) => `<article class="contract-clause"><span>Clausula ${String(i + 1).padStart(2, "0")}</span><h4>${title}</h4><p>${text}</p></article>`).join("")}
        </section>
        <section class="contract-annex">
          <h4>Anexo economico y de cumplimiento</h4>
          ${table(["Variable", "Valor"], [
            ["GMV mensual simulado", money(c.gmv)],
            ["Comision marketplace", money(c.comision)],
            ["Fee marketing mensual", money(c.fee)],
            ["Ingreso neto marketplace", money(c.ingresoNeto)],
            ["Cumplimiento agregado SLA", pct(c.cumplimiento * 100)],
            ["Penalizaciones calculadas", money(c.penalRetraso + c.penalStock)],
            ["Bono por cumplimiento total", money(c.bono)]
          ])}
        </section>
        <section class="signature-grid" aria-label="Bloques de firma">
          <article><span>Firma marketplace</span><strong>${raw.marketplace}</strong><p>Nombre, cargo y fecha</p></article>
          <article><span>Firma proveedor</span><strong>${raw.proveedor}</strong><p>Nombre, cargo y fecha</p></article>
        </section>
      </article>
    `;
  }

  function renderIndicators(raw, c) {
    return metrics([
      ["GMV", money(c.gmv)],
      ["Ingreso neto", money(c.ingresoNeto)],
      ["Float financiero", money(c.floatFin)],
      ["Cumplimiento SLA", pct(c.cumplimiento * 100)]
    ]) + table(
      ["Indicador", "Objetivo", "Real", "Estado"],
      c.checks.map((x) => [x[0], `${x[1]} ${x[4]}`, `${x[2]} ${x[4]}`, `<strong class="${x[3] ? "status-ok" : "status-bad"}">${x[3] ? "CUMPLE" : "REVISION"}</strong>`])
    ) + `<section class="risk-grid">
      ${riskCard("Riesgo SLA", c.riesgoSla, `Cumplimiento agregado: ${pct(c.cumplimiento * 100)}. Alto si queda por debajo del 85%.`)}
      ${riskCard("Riesgo financiero", c.riesgoFin, `Pago al proveedor: ${raw.diasPago} dias. Alto si supera 45 dias.`)}
      ${riskCard("Riesgo cliente", c.riesgoCliente, `Rating real ${raw.realRating}/5 y devoluciones ${pct(raw.realDevoluciones)}.`)}
      ${riskCard("Decision", c.decision, c.decision === "GO" ? "El escenario puede avanzar en la simulacion." : "Conviene renegociar condiciones, SLA o responsabilidades antes de firmar.")}
    </section>`;
  }

  function contractText(raw, c) {
    return `ACUERDO SLA MARKETPLACE - DOCUMENTO SIMULADO

Proveedor: ${raw.proveedor}
Marketplace: ${raw.marketplace}
Modelo comercial: ${raw.modelo}
Decision simulada: ${c.decision}

CLAUSULAS
${clauses(raw).map(([title, text], i) => `${i + 1}. ${title}: ${text}`).join("\n")}

ANEXO ECONOMICO Y DE CUMPLIMIENTO
GMV mensual simulado: ${money(c.gmv)}
Comision marketplace: ${money(c.comision)}
Fee marketing mensual: ${money(c.fee)}
Ingreso neto marketplace: ${money(c.ingresoNeto)}
Cumplimiento agregado SLA: ${pct(c.cumplimiento * 100)}
Penalizaciones calculadas: ${money(c.penalRetraso + c.penalStock)}
Bono por cumplimiento total: ${money(c.bono)}

FIRMAS
Marketplace: ${raw.marketplace}
Nombre, cargo y fecha:

Proveedor: ${raw.proveedor}
Nombre, cargo y fecha:`;
  }

  function refreshDeliverables() {
    const raw = data();
    const c = calc(raw);
    const contractView = document.querySelector("#contractView");
    const indicatorsView = document.querySelector("#indicatorsView");
    if (contractView) contractView.innerHTML = renderContract(raw, c);
    if (indicatorsView) indicatorsView.innerHTML = renderIndicators(raw, c);
    lastContract = contractText(raw, c);
  }

  function afterSimulationClick(selector) {
    const button = document.querySelector(selector);
    if (button) button.addEventListener("click", () => setTimeout(refreshDeliverables, 0));
  }

  afterSimulationClick("#runSimulation");
  afterSimulationClick("#loadDemo");
  document.querySelector("#copyContract")?.addEventListener("click", async () => {
    const button = document.querySelector("#copyContract");
    try {
      await navigator.clipboard.writeText(lastContract);
      button.textContent = "Contrato copiado";
    } catch {
      button.textContent = "Copia no disponible";
    }
    setTimeout(() => { button.textContent = "Copiar contrato preparado"; }, 1400);
  });
  refreshDeliverables();
})();
