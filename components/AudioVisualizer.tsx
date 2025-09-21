import React, { useEffect, forwardRef } from 'react';

declare const d3: any; // Use d3 from global scope provided by script tag

interface AudioVisualizerProps {
  audioBuffer: AudioBuffer | null;
}

const AudioVisualizer = forwardRef<SVGSVGElement, AudioVisualizerProps>(({ audioBuffer }, ref) => {
  useEffect(() => {
    if (!audioBuffer || !ref || !('current' in ref) || !ref.current || typeof d3 === 'undefined') return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove(); // Clear previous visualization

    const data = audioBuffer.getChannelData(0);
    const width = 800;
    const height = 150;
    const barWidth = 2;
    const barPadding = 1;

    svg.attr('width', '100%')
       .attr('height', height)
       .attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'none');
    
    // Explicit background for SVG to PNG conversion
    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#1f2937"); // Corresponds to bg-gray-800

    const samples = Math.floor(width / (barWidth + barPadding));
    const step = Math.floor(data.length / samples);
    const filteredData: number[] = [];
    for (let i = 0; i < samples; i++) {
        let blockStart = i * step;
        let sum = 0;
        for (let j = 0; j < step; j++) {
            sum = sum + Math.abs(data[blockStart + j]);
        }
        filteredData.push(sum / step);
    }

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData) as number])
        .range([height, 0]);

    const x = d3.scaleLinear()
        .domain([0, filteredData.length])
        .range([0, width]);

    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "barGradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#818cf8"); // indigo-400

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#c084fc"); // purple-400

    svg.selectAll('rect.bar')
        .data(filteredData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => x(i))
        .attr('y', (d: number) => y(d))
        .attr('width', barWidth)
        .attr('height', (d: number) => height - y(d))
        .attr('fill', 'url(#barGradient)');

  }, [audioBuffer, ref]);

  return (
    <div className="mt-6 flex justify-center bg-gray-800 p-4 rounded-lg overflow-hidden">
      <svg ref={ref}></svg>
    </div>
  );
});

export default AudioVisualizer;