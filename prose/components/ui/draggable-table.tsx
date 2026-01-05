"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	type UniqueIdentifier,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DraggableTableProps<TData> {
	data: TData[];
	columns: ColumnDef<TData>[];
	getRowId: (row: TData) => string;
	selectedIds: string[];
	onSelectionChange: (ids: string[]) => void;
	onReorder: (newData: TData[]) => void;
	className?: string;
}

function DraggableRow<TData>({
	row,
	isSelected,
	onToggleSelect,
}: {
	row: Row<TData>;
	isSelected: boolean;
	onToggleSelect: () => void;
}) {
	const { transform, transition, setNodeRef, isDragging, attributes, listeners } = useSortable({
		id: row.id,
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1 : 0,
		position: "relative",
		cursor: isDragging ? "grabbing" : "grab",
	};

	return (
		<TableRow
			ref={setNodeRef}
			style={style}
			data-state={isSelected ? "selected" : undefined}
			{...attributes}
			{...listeners}
		>
			<TableCell>
				<Checkbox
					checked={isSelected}
					onCheckedChange={onToggleSelect}
					onClick={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
				/>
			</TableCell>
			{row.getVisibleCells().map((cell) => (
				<TableCell key={cell.id}>
					{flexRender(cell.column.columnDef.cell, cell.getContext())}
				</TableCell>
			))}
		</TableRow>
	);
}

function DraggableTable<TData>({
	data,
	columns,
	getRowId,
	selectedIds,
	onSelectionChange,
	onReorder,
	className,
}: DraggableTableProps<TData>) {
	const dataIds = useMemo<UniqueIdentifier[]>(
		() => data.map((item) => getRowId(item)),
		[data, getRowId]
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => getRowId(row),
	});

	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {})
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			const oldIndex = dataIds.indexOf(active.id);
			const newIndex = dataIds.indexOf(over.id);
			onReorder(arrayMove(data, oldIndex, newIndex));
		}
	}

	function handleSelectAll() {
		if (selectedIds.length === data.length) {
			onSelectionChange([]);
		} else {
			onSelectionChange(data.map((item) => getRowId(item)));
		}
	}

	function handleToggleSelect(id: string) {
		if (selectedIds.includes(id)) {
			onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
		} else {
			onSelectionChange([...selectedIds, id]);
		}
	}

	const allSelected = data.length > 0 && selectedIds.length === data.length;
	const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;
	const selectAllChecked = allSelected ? true : someSelected ? "indeterminate" : false;

	return (
		<DndContext
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragEnd={handleDragEnd}
			sensors={sensors}
		>
			<Table className={cn(className)}>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							<TableHead>
								<Checkbox checked={selectAllChecked} onCheckedChange={handleSelectAll} />
							</TableHead>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id} colSpan={header.colSpan}>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
						{table.getRowModel().rows.map((row) => (
							<DraggableRow
								key={row.id}
								row={row}
								isSelected={selectedIds.includes(row.id)}
								onToggleSelect={() => handleToggleSelect(row.id)}
							/>
						))}
					</SortableContext>
				</TableBody>
			</Table>
		</DndContext>
	);
}

export { DraggableTable, type DraggableTableProps };
