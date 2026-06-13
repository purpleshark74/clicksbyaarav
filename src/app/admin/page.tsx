'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useTransition } from "react";
import { uploadFile } from "../actions/upload";

export default function AdminPage() {
    const [status, setStatus] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        const file = formData.get("file") as File;

        if (!file || file.size === 0) {
            setStatus("Please select a file first.");
            return;
        }

        setStatus("Uploading File to server...");

        startTransition(async () => {
            try {
                const result = await uploadFile(formData);

                if (result.success) {
                    setStatus(`Upload succesful! Saved as: ${result.key}`);
                } else {
                    setStatus("Upload failed.");
                }
            } catch (error) {
                console.error(error);
                setStatus("An error occured during the upload.");
            }
        })
    }

    return (
    <main style={{ padding: "2rem", maxWidth: "400px" }}>
      <h1>R2 Server-Side Upload</h1>
      
      {/* Pass the handler directly into the action attribute */}
      <form action={handleSubmit}>
        <input 
          type="file" 
          name="file" // This name MUST match formData.get('file') in actions.ts
          disabled={isPending} 
          required 
        />
        <button 
          type="submit" 
          disabled={isPending}
          style={{ display: "block", marginTop: "1rem", padding: "0.5rem 1rem" }}
        >
          {isPending ? "Uploading..." : "Upload"}
        </button>
      </form>
      
      {status && <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{status}</p>}
    </main>
 );
}



