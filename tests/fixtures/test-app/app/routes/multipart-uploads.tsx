import { Form, useActionData } from "@remix-run/react"
import {
	type ActionFunctionArgs,
	NodeOnDiskFile,
	json,
	unstable_createFileUploadHandler,
	unstable_parseMultipartFormData,
} from "@remix-run/node"

export async function action({ request }: ActionFunctionArgs) {
	const formData = await unstable_parseMultipartFormData(
		request,
		unstable_createFileUploadHandler(),
	)

	const file = formData.get("file")
	if (!(file instanceof NodeOnDiskFile)) {
		throw new Error("No file uploaded")
	}

	const text = await file.text()
	return json({ text })
}

export default function MultipartUploadsTest() {
	const data = useActionData<typeof action>()
	return (
		<>
			<Form method="post" encType="multipart/form-data">
				<input type="file" name="file" />
				<button type="submit">Submit</button>
			</Form>
			<p data-testid="result">{data?.text}</p>
		</>
	)
}
