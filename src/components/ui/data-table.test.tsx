import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataTable, type TableColumn } from "./data-table";

interface Row {
  code: string;
  status: string;
}

const rows: Row[] = [
  { code: "B-02", status: "OPEN" },
  { code: "A-01", status: "CLOSED" },
  { code: "C-03", status: "OPEN" },
];

const columns: TableColumn<Row>[] = [
  { key: "code", header: "Code", sortable: true, sortValue: (row) => row.code, accessor: (row) => row.code },
  { key: "status", header: "Status", sortable: true, sortValue: (row) => row.status, accessor: (row) => row.status },
];

describe("DataTable", () => {
  it("renders rows and headers", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.code} />);
    expect(screen.getByRole("columnheader", { name: /code/i })).toBeInTheDocument();
    expect(screen.getByText("B-02")).toBeInTheDocument();
    expect(screen.getByText("A-01")).toBeInTheDocument();
  });

  it("sorts by a sortable column on header click", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.code} />);

    const codeHeader = screen.getByRole("button", { name: /code/i });
    await user.click(codeHeader); // asc
    const firstAsc = screen.getAllByRole("row")[1];
    expect(firstAsc).toHaveTextContent("A-01");

    await user.click(codeHeader); // desc
    const firstDesc = screen.getAllByRole("row")[1];
    expect(firstDesc).toHaveTextContent("C-03");

    await user.click(codeHeader); // back to unsorted
    const firstUnsorted = screen.getAllByRole("row")[1];
    expect(firstUnsorted).toHaveTextContent("B-02");
  });

  it("paginates client-side and shows the pager", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.code}
        defaultPageSize={2}
      />,
    );

    expect(screen.getByText("B-02")).toBeInTheDocument();
    expect(screen.queryByText("C-03")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText("C-03")).toBeInTheDocument();
    expect(screen.queryByText("B-02")).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no rows", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.code}
        emptyTitle="No records yet"
        emptyBody="Create one to get started."
      />,
    );
    expect(screen.getByText("No records yet")).toBeInTheDocument();
    expect(screen.getByText("Create one to get started.")).toBeInTheDocument();
  });
});
