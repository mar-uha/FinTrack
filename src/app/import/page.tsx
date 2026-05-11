"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type ImportResult = {
  inserted: number;
  skipped: number;
  parseErrors?: string[];
};

type ImportError = {
  error: string;
  details?: string[];
};

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<ImportError | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;

    setBusy(true);
    setResult(null);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/import", { method: "POST", body: fd });
    const json = await res.json();

    if (!res.ok) {
      setError(json);
    } else {
      setResult(json);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Importer un relevé</h1>

      <Card>
        <CardHeader>
          <CardTitle>Fichier CSV BoursoBank</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv">Fichier .csv</Label>
              <Input
                id="csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <Button type="submit" disabled={!file || busy}>
              {busy ? "Import en cours…" : "Importer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Alert>
          <AlertTitle>Import terminé</AlertTitle>
          <AlertDescription>
            <p>
              <strong>{result.inserted}</strong> transaction(s) ajoutée(s),{" "}
              <strong>{result.skipped}</strong> doublon(s) ignoré(s).
            </p>
            {result.parseErrors && result.parseErrors.length > 0 && (
              <ul className="mt-2 text-sm list-disc pl-5">
                {result.parseErrors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.parseErrors.length > 5 && (
                  <li>…et {result.parseErrors.length - 5} autres erreurs</li>
                )}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            <p>{error.error}</p>
            {error.details && (
              <ul className="mt-2 text-sm list-disc pl-5">
                {error.details.slice(0, 5).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
