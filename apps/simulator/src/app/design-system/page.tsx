import { Button } from "@academyos/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@academyos/ui/card";
import { Badge } from "@academyos/ui/badge";

export default function DesignSystemPreview() {
  return (
    <div className="container mx-auto py-10 space-y-8 bg-background text-foreground min-h-screen p-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Design System Preview</h1>
        <p className="text-muted-foreground text-lg">
          Este é um painel de testes para comprovar o uso do esquema de cores e tipografia extraídos para o monorepo!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle>Painel de Componentes</CardTitle>
            <CardDescription>O componente Card compartilhado está funcionando.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Primary Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            
            <div className="pt-4 flex flex-col gap-3">
              <p className="text-sm font-medium">Testando Botões:</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Ação Principal</Button>
                <Button variant="secondary">Secundário</Button>
                <Button variant="outline">Contorno</Button>
                <Button variant="ghost">Fantasma</Button>
                <Button variant="destructive">Excluir</Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground border-t border-border pt-4 mt-4">
            Importado do pacote @academyos/ui
          </CardFooter>
        </Card>

        <div className="space-y-4">
          <div className="p-6 rounded-lg bg-primary text-primary-foreground">
            <h3 className="font-semibold mb-2">Caixa com Cor Primária</h3>
            <p className="text-sm opacity-90">Verificando se a variável --primary está resolvida corretamente.</p>
          </div>
          
          <div className="p-6 rounded-lg bg-muted text-muted-foreground border border-border">
            <h3 className="font-semibold mb-2">Caixa "Muted"</h3>
            <p className="text-sm">Verificando as variáveis --muted e --border.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
