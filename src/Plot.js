import React, { Component } from "react";
import * as d3 from "d3";

class Plot extends Component {
  state = {
    selectedColor: "Sentiment",
    selectedPoint: [],
  };

  componentDidMount() {
    this.chartRender();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.csv_data !== this.props.csv_data ||
      prevState.selectedColor !== this.state.selectedColor ||
      prevState.selectedPoint !== this.state.selectedPoint
    ) {
      this.chartRender();
    }
  }

  updateBorder() {
    d3.selectAll("circle").attr("stroke", (d) =>
      this.state.selectedPoint.some((t) => t.RawTweet === d.RawTweet)
        ? "#000000"
        : "none"
    );
  }

  clickTweet = (tweet) => {
    this.setState((prevState) => {
      const index = prevState.selectedPoint.findIndex(
        (e) => e.RawTweet === tweet.RawTweet
      );
      if (index === -1) {
        return { selectedPoint: [tweet, ...prevState.selectedPoint] };
      } else {
        return {
          selectedPoint: prevState.selectedPoint.filter(
            (_, i) => i !== index
          ),
        };
      }
    });
  };

  dropdownColor = (e) => {
    this.setState({ selectedColor: e.target.value });
  };

  chartRender() {
    const data = this.props.csv_data;

    if (!data || data.length <= 0) {
      return;
    }

    const width = 700;
    const height = 250;
    const margin = { top: 30, right: 150, bottom: 30, left: 100 };

    d3.select(".plot-visualization svg").remove();

    const svg = d3
      .select(".plot-visualization")
      .append("svg")
      .attr("width", width + margin.left + margin.right + 500)
      .attr("height", (height + margin.top + margin.bottom) * 3 - 150)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d["Dimension 1"]))
      .range([0, width - 300]);

    const groupByMonth = d3.group(data, (d) => d.Month);

    ["March", "April", "May"].forEach((monthValue, index) => {
      const dataByMonth = groupByMonth.get(monthValue) || [];

      const selectMonthGroup = svg
        .append("g")
        .attr("transform", `translate(0, ${index * (height + margin.top)})`);

      selectMonthGroup
        .append("text")
        .attr("x", -50)
        .attr("y", height / 2)
        .attr("text-anchor", "end")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(monthValue);

      const sentimentColorScale = d3
        .scaleLinear()
        .domain([-1, 0, 1])
        .range(["#e41a1c", "#ececec", "#4daf4a"]);

      const subjectivityColorScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range(["#ececec", "#4467c4"]);

      const simulation = d3
        .forceSimulation(dataByMonth)
        .force("x", d3.forceX((d) => xScale(d["Dimension 1"])).strength(1))
        .force("y", d3.forceY(height / 2).strength(0.1))
        .force("collide", d3.forceCollide(5).radius(6))
        .tick(100)
        .stop();

      selectMonthGroup
        .selectAll("circle")
        .data(dataByMonth)
        .enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 5)
        .attr("fill", (d) => {
          return this.state.selectedColor === "Sentiment"
            ? sentimentColorScale(d.Sentiment)
            : subjectivityColorScale(d.Subjectivity);
        })
        .attr("stroke-width", 2)
        .attr("transform", "translate(200,0)")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          this.clickTweet(d);
        });
      this.updateBorder();
    });

    const legendWidth = 30;
    const legendHeight = height * 2;
    const blockHeight = legendHeight / 20;

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width + 100}, ${height / 2})`);

    const legendBlock = legend
      .selectAll("rect")
      .data(
        d3.range(0, 20).map((i) => ({
          y: i * blockHeight,
          domain:
            this.state.selectedColor === "Sentiment"
              ? [-1 + i * 0.1, -0.9 + i * 0.1]
              : [i * 0.05, (i + 1) * 0.05],
        }))
      )
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d) => d.y)
      .attr("width", legendWidth)
      .attr("height", blockHeight)
      .style("fill", (d) => {
        if (this.state.selectedColor === "Sentiment") {
          return d3
            .scaleLinear()
            .domain([1, 0, -1])
            .range(["red", "#ececec", "green"])(
            (d.domain[0] + d.domain[1]) / 2
          );
        } else {
          return d3.scaleLinear().domain([1, 0]).range(["#ececec", "#4467c4"])(
            (d.domain[0] + d.domain[1]) / 2
          );
        }
      });

    if (this.state.selectedColor === "Sentiment") {
      legend
        .append("text")
        .attr("transform", `translate(${legendWidth + 40}, ${10})`)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Positive");

      legend
        .append("text")
        .attr("transform", `translate(${legendWidth + 40}, ${legendHeight})`)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Negative");
    } else {
      legend
        .append("text")
        .attr("transform", `translate(${legendWidth + 40}, ${10})`)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Subjective");

      legend
        .append("text")
        .attr("transform", `translate(${legendWidth + 40}, ${legendHeight})`)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Objective");
    }
  }

  render() {
    const selected = ["Sentiment", "Subjectivity"];

    return (
      <div className="plot">
        <div className="color-dropdown">
          <span>
            <strong>Color By: </strong>
          </span>
          <select
            value={this.state.selectedColor}
            onChange={this.dropdownColor}
          >
            {selected.map((selected) => (
              <option key={selected} value={selected}>
                {selected}
              </option>
            ))}
          </select>
        </div>
        <div className="plot-visualization"></div>
        <div className="tweet-data">
          {this.state.selectedPoint.map((tweet, index) => (
            <div key={index} className="tweetText">
              {tweet.RawTweet}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Plot;
