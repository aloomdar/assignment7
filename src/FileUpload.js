import React, { Component } from "react";

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      jsonData: null,
    };
  }

  handleFileSubmit = (e) => {
    e.preventDefault();
    const { file } = this.state;

    if (file) {
      const read = new FileReader();
      read.onload = (e) => {
        const text = e.target.result;
        const json = JSON.parse(text).slice(0, 300);
        this.setState({ jsonData: json });
        this.props.set_data(json);
      };
      read.readAsText(file);
    }
  };

  render() {
    return (
      <div style={{ backgroundColor: "#f0f0f0", padding: 20 }}>
        <h2>Upload a JSON File</h2>
        <form onSubmit={this.handleFileSubmit}>
          <input
            type="file"
            accept=".json"
            onChange={(event) => this.setState({ file: event.target.files[0] })}
          />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
}

export default FileUpload;
