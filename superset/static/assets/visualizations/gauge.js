import d3 from 'd3';
import { d3FormatPreset } from '../javascripts/modules/utils';
import { gg } from '../utils/viz.v1';
import './gauge.css';

function gaugeVis(slice, payload) {
  const data = payload.data;
  const fd = slice.formData;
  const div = d3.select(slice.selector);
  const margin = {
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
  };
  const width = slice.width() - margin.left - margin.right;
  const height = slice.height() - margin.top - margin.bottom;

  const rgba = function (c) { return 'rgba(' + [c.r, c.g, c.b, c.a].join(',') + ')'; }
  div.selectAll('*').remove();
  const svg = div.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  // .append('g')
  // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  svg.attr('width', width);
  svg.attr('height', height);
  if (fd.viz_type === 'gauge') {
    const tickStep = function (start, stop, count) {
      const e10 = Math.sqrt(50);
      const e5 = Math.sqrt(10);
      const e2 = Math.sqrt(2);
      const step0 = Math.abs(stop - start) / Math.max(0, count);
      let step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10));
      const error = step0 / step1;
      if (error >= e10) {
        step1 *= 10;
      } else if (error >= e5) {
        step1 *= 5;
      } else if (error >= e2) {
        step1 *= 2;
      }
      return stop < start ? -step1 : step1;
    };

    // Drawing gauge
    const tick = function (start, stop, count) {
      const step = tickStep(start, stop, count);
      return d3.range(
        Math.ceil(start / step) * step,
        Math.floor(stop / step) * step + step / 2, // inclusive
        step);
    };

    let min = 0;
    let max = 100;
    let num = 10;
    if (fd.min !== 'undefined') {
      min = parseInt(fd.min);
    } else {
      min = 0;
    }

    if (fd.max !== 'undefined') {
      max = parseInt(fd.max);
    } else {
      max = 100;
    }

    if (fd.num !== 'undefined') {
      num = parseInt(fd.num);
    } else {
      num = 10;
    }
    const dom = [min, max];

    const getOuterR = function () {
      const param = 30;
      let outerR = (width - param) / 2;
      if (height <= width) {
        outerR = (height - param) / 2;
      }
      if (outerR <= 120) {
        outerR = 120;
      }
      return outerR;
    };

    const outerR = getOuterR();
    const leftRightD = (width - outerR * 2) / 2;
    const topBottomD = (height - outerR * 2) / 2;

    const innerR = outerR * 0.2;
    const cols = data.columns[0];
    const format = d3FormatPreset(fd.y_axis_format);
    const value = data.records[0][cols];
    const textValue = format(value);

    const getX = function () {
      const len = textValue.toString().length;
      let xle = {};
      if (len > 12) {
        xle = { x: -100, le: 200 };
      } else if (len > 8) {
        xle = { x: -70, le: 130 };
      } else if (len > 4) {
        xle = { x: -50, le: 100 };
      } else if (len > 2) {
        xle = { x: -30, le: 50 };
      } else if (len > 1) {
        xle = { x: -10, le: 30 };
      } else {
        xle = { x: 0, le: 30 };
      }
      return xle;
    };
    // create a gauge object by setting various options.
    const gauge = gg()
      .domain(dom)
      .ticks(tick(dom[0], dom[1], num)) // 刻度范围，起始值，结束值，切片数量
      .innerFaceColor(rgba(fd.inner_face_color))
      .faceColor(rgba(fd.face_color))
      .needleColor(rgba(fd.needle_color))
      .outerRadius(outerR)
      .innerRadius(innerR)
      .value(value)
      .labelLocation(0.73)
      .ease('linear');
      // create the gradients and filters in svg.
    gauge.defs(svg, 1);
    // draw the gauge in the svg
    svg.append('g')
      .attr('transform', 'translate(' + (leftRightD + outerR) + ',' + (topBottomD + outerR) + ')')
      .call(gauge)
      .append('text')
      .attr('x', getX().x)
      .attr('y', topBottomD + outerR * 0.4)
      .attr('textLength', getX().le)
      .attr('style', 'stroke: ' + rgba(fd.value_color) + ';font-size:' + fd.value_font_size + 'px;')
      // .attr('class', 'textClass')
      .text(textValue.toString());

    const selectorInnerFace = svg.selectAll('.innerFace');
    selectorInnerFace.style('fill', function (d, i) {
      return rgba(fd.inner_face_color);
    });
    const selectorFace = svg.selectAll('.face');
    selectorFace.style('fill', function (d, i) {
      return rgba(fd.face_color);
    });
    const selectorNeedle = svg.selectAll('polygon');
    selectorNeedle.style('fill', function (d, i) {
      return rgba(fd.needle_color);
    });
    const selectorLabel = svg.selectAll('.label');
    selectorLabel.style('fill', function (d, i) {
      return rgba(fd.ticks_color);
    });
    selectorLabel.style('font-size', function (d, i) {
      return fd.ticks_font_size;
    });
    const selectorMajorTicks = svg.selectAll('.majorTicks');
    selectorMajorTicks.style('stroke', function (d, i) {
      return rgba(fd.stroke_color);
    });
    selectorMajorTicks.style('stroke-width', function (d, i) {
      return fd.stroke_width;
    });
  }
}

module.exports = gaugeVis;
