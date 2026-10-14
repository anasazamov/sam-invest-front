'use client'

import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'

export interface SortableItemData {
    id: string
    label: ReactNode
}

function Row({ id, label }: SortableItemData) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 ${
                isDragging ? 'z-10 opacity-80 shadow-lg' : ''
            }`}
        >
            <button
                type="button"
                className="cursor-grab touch-none text-slate-400 hover:text-slate-600 active:cursor-grabbing"
                {...attributes}
                {...listeners}
                aria-label="drag"
            >
                <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1">{label}</div>
        </div>
    )
}

/**
 * Drag-and-drop bilan tartiblash ro'yxati. Tortib qo'yilganda yangi tartib
 * (id'lar massivi) `onReorder` orqali qaytariladi.
 */
export default function SortableList({
    items,
    onReorder,
}: {
    items: SortableItemData[]
    onReorder: (orderedIds: string[]) => void
}) {
    const [order, setOrder] = useState<SortableItemData[]>(items)

    // Tashqi ma'lumot o'zgarsa (yuklangach) sinxronlaymiz
    useEffect(() => {
        setOrder(items)
    }, [items])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = order.findIndex((i) => i.id === active.id)
        const newIndex = order.findIndex((i) => i.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return
        const next = arrayMove(order, oldIndex, newIndex)
        setOrder(next)
        onReorder(next.map((i) => i.id))
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={order.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-2">
                    {order.map((item) => (
                        <Row key={item.id} id={item.id} label={item.label} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
