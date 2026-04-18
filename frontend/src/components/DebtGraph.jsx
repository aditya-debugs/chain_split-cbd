import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { shortenAddress } from "../utils/formatters";

export default function DebtGraph({ nodes, links }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!nodes?.length) return;

    const width = 600;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Arrow marker for directed edges
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#f97316");

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(50));

    // Draw links (edges)
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#f97316")
      .attr("stroke-width", (d) => Math.max(1, Math.min(d.amount * 4, 6)))
      .attr("stroke-opacity", 0.8)
      .attr("marker-end", "url(#arrow)");

    // Edge labels (amount)
    const edgeLabel = svg.append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("fill", "#fdba74")
      .attr("font-size", "11px")
      .attr("text-anchor", "middle")
      .text((d) => `${d.amount.toFixed(4)} ETH`);

    // Draw nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 22)
      .attr("fill", (d) =>
        d.balance > 0 ? "#16a34a" : d.balance < 0 ? "#dc2626" : "#4b5563"
      )
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    // Node labels
    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text((d) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      edgeLabel
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2 - 8);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    return () => simulation.stop();
  }, [nodes, links]);

  if (!nodes?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No debt data to visualize yet.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Owed money</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Owes money</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-600 inline-block" /> Settled</span>
        <span className="flex items-center gap-1"><span className="text-orange-400">→</span> ETH flow direction</span>
      </div>
      <svg
        ref={svgRef}
        className="w-full border border-gray-700 rounded-xl bg-gray-950"
        style={{ height: "400px" }}
      />
    </div>
  );
}
