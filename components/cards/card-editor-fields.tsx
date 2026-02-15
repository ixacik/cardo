import { useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { TextField } from "@/components/ui";
import { cn } from "@/lib/cn";

export type CardEditorValue = {
	title: string;
	frontText: string;
	backText: string;
	imageUris: string[];
};

type CardEditorErrors = {
	title?: string | null;
	frontText?: string | null;
	backText?: string | null;
};

type CardEditorFieldsProps = {
	value: CardEditorValue;
	onChange: (nextValue: CardEditorValue) => void;
	errors?: CardEditorErrors;
	disabled?: boolean;
};

const inputClassName = "mt-1.5";

export function CardEditorFields({
	value,
	onChange,
	errors,
	disabled = false,
}: CardEditorFieldsProps) {
	const [imageUri, setImageUri] = useState("");

	const onAddImage = () => {
		const nextUri = imageUri.trim();
		if (!nextUri) {
			return;
		}

		onChange({
			...value,
			imageUris: [...value.imageUris, nextUri],
		});
		setImageUri("");
	};

	const onRemoveImage = (targetIndex: number) => {
		onChange({
			...value,
			imageUris: value.imageUris.filter((_, index) => index !== targetIndex),
		});
	};

	return (
		<View className="gap-2.5">
			<ThemedText type="subtitle" className="mt-1.5">
				Title
			</ThemedText>
			<TextField
				editable={!disabled}
				value={value.title}
				onChangeText={(title) => onChange({ ...value, title })}
				placeholder="Give this card a title"
				invalid={Boolean(errors?.title)}
				className={inputClassName}
			/>
			{errors?.title ? (
				<ThemedText className="mt-1 text-danger">{errors.title}</ThemedText>
			) : null}

			<ThemedText type="subtitle" className="mt-1.5">
				Front
			</ThemedText>
			<TextField
				editable={!disabled}
				value={value.frontText}
				onChangeText={(frontText) => onChange({ ...value, frontText })}
				placeholder="Write the front text"
				invalid={Boolean(errors?.frontText)}
				className={cn(inputClassName, "min-h-[120px]")}
				style={{ textAlignVertical: "top" }}
				multiline
			/>
			{errors?.frontText ? (
				<ThemedText className="mt-1 text-danger">{errors.frontText}</ThemedText>
			) : null}

			<ThemedText type="subtitle" className="mt-1.5">
				Back
			</ThemedText>
			<TextField
				editable={!disabled}
				value={value.backText}
				onChangeText={(backText) => onChange({ ...value, backText })}
				placeholder="Write the back text"
				invalid={Boolean(errors?.backText)}
				className={cn(inputClassName, "min-h-[120px]")}
				style={{ textAlignVertical: "top" }}
				multiline
			/>
			{errors?.backText ? (
				<ThemedText className="mt-1 text-danger">{errors.backText}</ThemedText>
			) : null}
		</View>
	);
}
