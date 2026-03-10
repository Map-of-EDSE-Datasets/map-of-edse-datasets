# A Navigable Map of Datasets in Engineering Design and Systems Engineering

An interactive web application that visualizes and organizes datasets used in Engineering Design and Systems Engineering (EDSE) research. The map provides a multi-dimensional taxonomy, knowledge graph visualization, and faceted search across engineering domains, lifecycle stages, data types, and formats.

**Paper:** *A Framework and Prototype for a Navigable Map of Datasets in Engineering Design and Systems Engineering*
**IDETC/CIE 2026 Conference Submission**

---

## Repository Structure

```
map-of-datasets/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── data_source_submission.yml  # New dataset submission template
│   │   └── data_correction.yml         # Data correction issue template
│   └── workflows/
│       ├── deploy-pages.yml            # GitHub Pages deployment
│       └── validate-dataset-submission.yml  # Dataset submission validation
├── index.html              # Entry HTML
├── app.js                  # Application logic (views, graph, filters)
├── style.css               # Global styles
└── datasets.json           # Dataset catalog (source of truth)
```

---

## Use of the Web Page

### Tabs

| Tab | Description |
|-----|-------------|
| **Dashboard** | At-a-glance summary of the catalog: total datasets, publications, tools, year range, and distribution charts for each taxonomic dimension (domain, lifecycle, data type, format). |
| **Graph View** | Interactive knowledge graph using a force-directed layout. Dataset nodes (rectangles) connect to taxonomy term nodes (ellipses) colored by dimension. Layer toggles show/hide specific dimensions. |
| **Table View** | Searchable, filterable table with taxonomy classifications rendered as color-coded badges. Click a row to view full dataset details. |

### Features

- **Faceted filters** -- Filter by engineering domain, lifecycle stage, data type, and data format. Filters apply across all views.
- **Dataset detail panel** -- Click any dataset to view full metadata: source, license, year, tools, key publications, and a Google Scholar search link.
- **About modal** -- Project context, paper reference, and links for community contribution.
- **Submit Dataset** -- Direct link to GitHub issue template for proposing new datasets.
- **Report Issue** -- Direct link to GitHub issue template for reporting data corrections.

---

## Data Content

### Dataset Catalog (`datasets.json`)

Each dataset entry contains:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `name` | Official or commonly used name |
| `description` | Brief description of contents and purpose |
| `domain` | Engineering domain (Aerospace, Automotive, Biomedical, etc.) |
| `subdomain` | Specific area within the domain |
| `lifecycle` | System lifecycle stage (Requirements, Design, Manufacturing, etc.) |
| `dataType` | Data modality (Textual, Geometric, Behavioral, Experimental, Operational) |
| `format` | Structural category (Structured, Semi-Structured, Unstructured, Domain-Specific) |
| `formatDetail` | Specific file format(s) (CSV, JSON, STEP, MAT, etc.) |
| `primaryUse` | Main research or engineering application |
| `source` | Organization or institution |
| `url` | Direct link to access or download |
| `license` | Distribution license |
| `year` | Year first published |
| `publications` | Key paper references |
| `tools` | Common tools used with this dataset |
| `tags` | Keywords for discoverability |

---

## How to Submit a New Dataset

1. Go to the [GitHub repository](https://github.com/Map-of-Datasets/map-of-datasets).
2. Click **Issues** → **New issue**.
3. Select the **"Submit a New Dataset"** template (or use the direct link: [New Dataset Submission](https://github.com/Map-of-Datasets/map-of-datasets/issues/new?template=data_source_submission.yml)).
4. Fill in the template fields:

| Field | Required | Description |
|-------|----------|-------------|
| **Dataset Name** | Yes | Official or commonly used name |
| **Description** | Yes | Brief description of contents and purpose |
| **Engineering Domain** | Yes | Primary engineering domain |
| **System Lifecycle Stage** | Yes | Which lifecycle stage it covers |
| **Data Type** | Yes | Primary data modality |
| **Data Format** | Yes | Structural category |
| **Format Detail** | Yes | Specific file format(s) |
| **Primary Use** | Yes | Main research application |
| **Source / Institution** | Yes | Creator or maintainer |
| **Dataset URL** | Yes | Direct access link |
| **Year Published** | Yes | Year first made available |
| **License** | No | Distribution license |
| **Estimated Citations** | No | Approximate citation count |
| **Common Tools** | No | Tools used with this dataset |
| **Tags** | No | Keywords for discoverability |
| **Key Publications** | No | Associated paper references |

5. Submit the issue. A maintainer will review and validate the submission.

---

## How to Open an Issue (Data Correction)

If you find incorrect, missing, or problematic data, please open a GitHub issue using the **Data Correction** template.

### Steps

1. Go to the [GitHub repository](https://github.com/Map-of-Datasets/map-of-datasets).
2. Click **Issues** → **New issue**.
3. Select the **"Report a Data Issue"** template (or use the direct link: [New Data Correction Issue](https://github.com/Map-of-Datasets/map-of-datasets/issues/new?template=data_correction.yml)).
4. Fill in the template fields:

| Field | Required | Description |
|-------|----------|-------------|
| **Dataset Name** | Yes | Which dataset has the issue |
| **Type of Issue** | Yes | Incorrect information, missing data, broken link, outdated, duplicate, or other |
| **Description** | Yes | What is wrong and what should it be |
| **Suggested Correction** | No | The correct information if known |
| **Source / Reference** | No | Link or reference supporting the correction |

5. Submit the issue.

---

## Deploy

### GitHub Pages (automatic)

A GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) deploys the app to GitHub Pages on every push to `main`. After creating the repo:

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` -- the workflow will build and deploy

The app will be available at **https://map-of-datasets.github.io/map-of-datasets**.

---

## Resources

- **GitHub Repository:** [Map-of-Datasets/map-of-datasets](https://github.com/Map-of-Datasets/map-of-datasets)
- **Paper:** IDETC/CIE 2026 Conference Submission
