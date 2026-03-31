import { useState, useCallback } from "react";

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export function useConfirmModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<ConfirmationOptions>({
        title: "Confirm",
        message: "Are you sure?",
        confirmText: "Confirm",
        cancelText: "Cancel",
    });

    let resolvePromise: ((value: boolean) => void) | null = null;

    const confirm = useCallback(
        (options: ConfirmationOptions): Promise<boolean> => {
            return new Promise((resolve) => {
                setConfig({
                    title: options.title,
                    message: options.message,
                    confirmText: options.confirmText || "Confirm",
                    cancelText: options.cancelText || "Cancel",
                });
                resolvePromise = resolve;
                setIsOpen(true);
            });
        },
        []
    );

    const handleConfirm = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(true);
        }
        setIsOpen(false);
    }, []);

    const handleCancel = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(false);
        }
        setIsOpen(false);
    }, []);

    return {
        isOpen,
        config,
        confirm,
        handleConfirm,
        handleCancel,
    };
}
