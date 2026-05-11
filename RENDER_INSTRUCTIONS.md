# 🎨 HOW TO RENDER THE UML DIAGRAMS

This guide explains how to view and render all the UML diagrams in this project.

---

## 📋 Table of Contents

1. [Quick View Options](#quick-view-options)
2. [Online Rendering](#online-rendering)
3. [Local Rendering](#local-rendering)
4. [VS Code Integration](#vs-code-integration)
5. [Export Options](#export-options)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick View Options

### **Option 1: Online PlantUML Editor (Recommended for Quick View)**

**Website**: https://www.plantuml.com/plantuml/uml/

**Steps**:
1. Go to https://www.plantuml.com/plantuml/uml/
2. Copy any PlantUML diagram code from `UML_DIAGRAMS_AND_SRS.md`
3. Paste into the editor's left panel
4. Click "Render" or wait for auto-render
5. View the diagram on the right panel
6. Export as PNG, SVG, or PDF

**Advantages**: ✅ No installation, ✅ Interactive, ✅ Real-time updates

---

### **Option 2: VS Code with Extensions (Recommended for Development)**

#### **Method A: PlantUML Extension**

**Extension**: "PlantUML" by jebbs
- **VS Code Marketplace**: https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml

**Installation**:
```bash
# Open VS Code Command Palette (Ctrl+Shift+P)
# Type: ext install jebbs.plantuml
# Click Install
```

**Usage**:
1. Open any `.puml` or `.plantuml` file
2. Right-click → "PlantUML: Preview"
3. View live preview in side panel
4. Changes update automatically

**Export**:
1. Right-click → "PlantUML: Export Current Diagram"
2. Choose format (PNG, SVG, PDF)
3. File saved to project directory

---

#### **Method B: Markdown Preview Enhanced**

**Extension**: "Markdown Preview Enhanced" by Yiyi Wang
- **VS Code Marketplace**: https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced

**Installation**:
```bash
# Open VS Code Command Palette (Ctrl+Shift+P)
# Type: ext install markdown-preview-enhanced
# Click Install
```

**Usage**:
1. Open `UML_DIAGRAMS_AND_SRS.md`
2. Right-click → "Markdown Preview Enhanced: Open Preview"
3. PlantUML diagrams render automatically
4. Scroll to view all diagrams

**Advantages**: ✅ Renders in markdown, ✅ Full document view, ✅ Beautiful formatting

---

### **Option 3: Online Markdown Viewers**

#### **GitHub Markdown Rendering** (Free, No Setup)
1. Push file to GitHub repository
2. PlantUML diagrams render automatically
3. View directly on GitHub web interface

**Note**: Only works if file is in a public GitHub repo or you have access

#### **GitLab/Gitea Markdown** (If hosted on GitLab)
- Similar to GitHub
- Visit project → markdown file
- Diagrams render in web interface

---

## 🌐 Online Rendering

### **PlantUML Online Service**

**URL**: https://www.plantuml.com/plantuml/uml/

**Quick Workflow**:
```
Copy Code → Paste in Editor → Auto-Render → View Diagram
```

**Export Formats**:
- PNG (Default)
- SVG (Vector - best for scaling)
- PDF (For printing)
- TXT (ASCII art)
- EPS (PostScript)

**Direct URL Encoding**:
You can also create a direct URL by URL-encoding the PlantUML code:

```
https://www.plantuml.com/plantuml/png/SoWkIImgAStDuU9oICqhIKqiIYqgIIrAIUpa8PQf2QdHrRLJ24ajEW00
```

---

### **Alternative Online Services**

1. **Kroki.io**: https://kroki.io/
   - Supports PlantUML, Mermaid, GraphViz, etc.
   - Browser-based editor
   - REST API available

2. **LiveDraw.io**: https://www.drawio.com/
   - Online diagram editor
   - Manual creation (not auto-rendering)
   - Good for modifications

---

## 💻 Local Rendering

### **Option 1: Install PlantUML Locally**

#### **Prerequisites**:
- Java 8+ installed
- GraphViz installed

#### **Windows Installation**:

```powershell
# 1. Install Java (if not already installed)
# Download from: https://www.oracle.com/java/technologies/downloads/

# 2. Install GraphViz
# Download from: https://graphviz.org/download/
# Or via Chocolatey:
choco install graphviz

# 3. Install PlantUML
# Download JAR: https://plantuml.com/download
# Or via Chocolatey:
choco install plantuml

# 4. Verify installation
plantuml -version
```

#### **macOS Installation**:

```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install GraphViz
brew install graphviz

# Install PlantUML
brew install plantuml

# Verify
plantuml -version
```

#### **Linux Installation** (Ubuntu/Debian):

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install default-jre graphviz

# Install PlantUML
sudo apt-get install plantuml

# Verify
plantuml -version
```

#### **Usage**:

```bash
# Convert PlantUML file to PNG
plantuml diagram.puml -o output_directory

# Convert to SVG
plantuml diagram.puml -tsvg -o output_directory

# Convert to PDF
plantuml diagram.puml -tpdf -o output_directory

# Batch convert all files in directory
plantuml src/ -o out/
```

---

### **Option 2: Docker Container**

```bash
# Pull PlantUML Docker image
docker pull plantuml/plantuml

# Run container
docker run --rm -v /path/to/diagrams:/diagrams plantuml/plantuml -o /diagrams/output *.puml

# Example (Windows PowerShell):
docker run --rm -v C:\Project\diagrams:/diagrams plantuml/plantuml /diagrams/*.puml
```

---

### **Option 3: Python Script**

```python
# Install PlantUML Python package
pip install plantuml

# Script to render all diagrams
import os
from plantuml import PlantUML

# Initialize PlantUML
puml = PlantUML(url='http://www.plantuml.com/plantuml/png/')

# Render diagram
with open('diagram.puml', 'r') as f:
    code = f.read()

# Generate image
image_data = puml.processes(code)
with open('output.png', 'wb') as f:
    f.write(image_data)
```

---

## 📝 VS Code Integration (Step-by-Step)

### **Complete Setup Guide**

#### **Step 1: Install PlantUML Extension**

```
1. Open VS Code
2. Press: Ctrl + Shift + X (Extensions)
3. Search: "plantuml"
4. Click on "PlantUML" by jebbs
5. Click "Install"
6. Reload VS Code
```

#### **Step 2: Create PlantUML Files**

```bash
# Create .puml files for each diagram
cd e:\hackthons\Team_Kaizen_HackXplore-main

# Create diagrams folder
mkdir diagrams

# Create individual diagram files (from the markdown)
# Copy each diagram code block into separate .puml files
```

#### **Step 3: Configure Settings (Optional)**

Open `.vscode/settings.json`:

```json
{
  "plantuml.exportOutDir": "./diagrams/output",
  "plantuml.exportFormat": "svg",
  "plantuml.autoUpdate": true,
  "plantuml.server": "https://www.plantuml.com/plantuml"
}
```

#### **Step 4: Preview & Export**

```
1. Right-click on .puml file
2. Select "PlantUML: Preview"
3. View in side panel
4. Right-click again → "PlantUML: Export Current Diagram"
5. Choose format (PNG/SVG/PDF)
6. File exports to output directory
```

---

## 📤 Export Options

### **Supported Formats**

| Format | Best For | Size | Quality |
|--------|----------|------|---------|
| **PNG** | Web, Email, Quick Share | Medium | Good |
| **SVG** | Scaling, Web, Print | Large | Excellent |
| **PDF** | Print, Document | Medium | Excellent |
| **EPS** | Professional Print | Medium | Excellent |
| **TXT** | ASCII Art, Simple Display | Small | Basic |

### **Export Steps**

#### **Via PlantUML Online Editor**:
1. Paste diagram code
2. Click "Export" button
3. Choose format
4. Download

#### **Via VS Code Extension**:
1. Open .puml file
2. Right-click → "PlantUML: Export Current Diagram"
3. Choose format
4. Auto-saves to configured output directory

#### **Via Command Line**:
```bash
# PNG (default)
plantuml diagram.puml

# SVG
plantuml -tsvg diagram.puml

# PDF
plantuml -tpdf diagram.puml

# All formats
plantuml -tpng -tsvg -tpdf diagram.puml
```

---

## 🛠️ Troubleshooting

### **Problem 1: "PlantUML not found" error**

**Solution**:
```bash
# Verify PlantUML is installed
plantuml -version

# If not found, reinstall:
# Windows (Chocolatey):
choco install plantuml

# macOS (Homebrew):
brew install plantuml

# Linux (apt):
sudo apt-get install plantuml
```

### **Problem 2: "Graphviz not found" error**

**Solution**:
```bash
# Install Graphviz
# Windows:
choco install graphviz

# macOS:
brew install graphviz

# Linux:
sudo apt-get install graphviz
```

### **Problem 3: VS Code extension not working**

**Solution**:
1. Uninstall extension: Right-click → "Uninstall"
2. Reload VS Code: Ctrl+R
3. Reinstall extension
4. Check extension is active (should have checkmark)

### **Problem 4: SVG export is empty**

**Solution**:
- Use PNG export instead
- Or use PlantUML online editor for SVG
- SVG rendering may require specific PlantUML settings

### **Problem 5: Diagram code in markdown not rendering**

**Solution**:
1. Ensure markdown file is named `.md`
2. Use Markdown Preview Enhanced extension
3. Restart VS Code
4. Try online viewer if local rendering fails

---

## 📚 Diagram File Organization

### **Recommended Structure**:

```
project-root/
├── diagrams/
│   ├── 01_use_case.puml
│   ├── 02_class.puml
│   ├── 03_sequence_assignment.puml
│   ├── 04_sequence_quiz.puml
│   ├── 05_sequence_viva.puml
│   ├── 06_sequence_recommendation.puml
│   ├── 07_activity_evaluation.puml
│   ├── 08_activity_timetable.puml
│   ├── 09_state_machine.puml
│   ├── 10_component.puml
│   ├── 11_deployment.puml
│   ├── 12_erd.puml
│   ├── 13_dfd.puml
│   ├── 14_sequence_collaboration.puml
│   └── output/
│       ├── 01_use_case.png
│       ├── 02_class.svg
│       └── ... (all exported diagrams)
│
├── UML_DIAGRAMS_AND_SRS.md
├── UML_QUICK_REFERENCE.md
└── RENDER_INSTRUCTIONS.md (this file)
```

---

## 🎯 Quick Start Checklist

- [ ] **Read** `UML_DIAGRAMS_AND_SRS.md` (main document)
- [ ] **Read** `UML_QUICK_REFERENCE.md` (summary guide)
- [ ] **Choose** rendering method (online or local)
- [ ] **Install** required tools (if local rendering)
- [ ] **Copy** diagram codes into `.puml` files
- [ ] **Render** diagrams to view them
- [ ] **Export** to PNG/SVG/PDF as needed
- [ ] **Share** with team members

---

## 🌟 Recommended Rendering Workflow

### **For Quick Viewing**:
1. Go to https://www.plantuml.com/plantuml/uml/
2. Copy diagram code
3. Paste into editor
4. View instantly

### **For Development/Modification**:
1. Install VS Code PlantUML extension
2. Create `.puml` files
3. Use live preview
4. Export when complete

### **For Team Sharing**:
1. Push `.puml` files to GitHub
2. Push `UML_DIAGRAMS_AND_SRS.md` to GitHub
3. Share GitHub link with team
4. Diagrams render automatically on GitHub

### **For Documentation**:
1. Export diagrams as SVG (best quality)
2. Include in project documentation
3. Reference in README.md
4. Generate PDF for stakeholders

---

## 📞 Support Resources

- **PlantUML Official**: https://plantuml.com/
- **PlantUML Syntax Guide**: https://plantuml.com/guide
- **VS Code Extensions**: https://marketplace.visualstudio.com/
- **Graphviz Documentation**: https://graphviz.org/documentation/
- **PlantUML on GitHub**: https://github.com/plantuml/plantuml

---

## 💡 Tips & Tricks

### **Tip 1: Speed Up Local Rendering**
```bash
# Use PNG format (faster than SVG)
plantuml -tpng *.puml
```

### **Tip 2: Batch Export**
```bash
# Export multiple formats at once
plantuml -tpng -tsvg *.puml
```

### **Tip 3: Live Updates in VS Code**
```
Enable "Auto Update" in PlantUML settings
Changes render automatically as you type
```

### **Tip 4: Create Custom Styles**
Add to any diagram:
```plantuml
!define ACCENT_COLOR #0277bd
!define BG_COLOR #f0f0f0
skinparam backgroundColor BG_COLOR
skinparam actorBorderColor ACCENT_COLOR
```

### **Tip 5: Share Direct URLs**
```
Create URL-encoded links:
https://www.plantuml.com/plantuml/png/[ENCODED_DIAGRAM]
Share with colleagues without copying code
```

---

## 📊 Diagram Reference Quick Links

**Assuming diagrams exported to `diagrams/output/`:**

| Diagram | View | Type |
|---------|------|------|
| [Use Case](file:///diagrams/output/01_use_case.png) | SVG | Overview |
| [Class Diagram](file:///diagrams/output/02_class.png) | SVG | Structure |
| [Assignment Sequence](file:///diagrams/output/03_sequence_assignment.png) | PNG | Workflow |
| [Quiz Sequence](file:///diagrams/output/04_sequence_quiz.png) | PNG | Workflow |
| [Viva Sequence](file:///diagrams/output/05_sequence_viva.png) | PNG | Workflow |
| [Recommendation Sequence](file:///diagrams/output/06_sequence_recommendation.png) | PNG | Workflow |
| [Activity Evaluation](file:///diagrams/output/07_activity_evaluation.png) | PNG | Process |
| [Component Diagram](file:///diagrams/output/10_component.png) | SVG | Architecture |
| [Deployment Diagram](file:///diagrams/output/11_deployment.png) | SVG | Infrastructure |

---

## ✅ Verification Checklist

After rendering, verify:

- [ ] All 14 diagrams render without errors
- [ ] Diagrams match descriptions in SRS document
- [ ] All actors appear in use case diagram
- [ ] All entities appear in class diagram
- [ ] Sequence flows are logical and complete
- [ ] Component relationships are correct
- [ ] Deployment nodes match architecture
- [ ] Export quality is acceptable

---

## 📝 Document Information

| Property | Value |
|----------|-------|
| Document | RENDER_INSTRUCTIONS.md |
| Purpose | Guide to rendering UML diagrams |
| Format | PlantUML (.puml) |
| Tools Covered | Online Editor, VS Code, CLI, Docker |
| Supported OS | Windows, macOS, Linux |
| Last Updated | December 2, 2025 |

---

**Happy Diagramming! 🎨**

For questions or issues, refer to the main SRS document: `UML_DIAGRAMS_AND_SRS.md`

