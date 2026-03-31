"use client";

import React from "react";
import { WorkshopModal } from "./WorkshopModal";
import { WorkshopButton } from "@/components/ui/WorkshopButton";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    isLoading = false,
    variant = "warning",
}: ConfirmationModalProps) {
    const getConfirmVariant = () => {
        switch (variant) {
            case "danger":
                return "danger";
            case "warning":
                return "primary";
            case "info":
                return "outline";
            default:
                return "primary";
        }
    };

    return (
        <WorkshopModal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            width="sm"
        >
            <div className="flex flex-col gap-6">
                <p className="text-sm text-foreground leading-relaxed">{message}</p>

                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                    <WorkshopButton
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </WorkshopButton>
                    <WorkshopButton
                        variant={getConfirmVariant()}
                        onClick={onConfirm}
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        {confirmText}
                    </WorkshopButton>
                </div>
            </div>
        </WorkshopModal>
    );
}
