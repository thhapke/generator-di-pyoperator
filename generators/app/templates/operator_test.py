
import os
import pandas as pd




class operator_test :

    def __init__(self,source_path):
        self.source_path = source_path

    def _filename(self,testdata_file) :
        operator_dir = os.path.dirname(self.source_path)
        operator = os.path.basename(operator_dir)
        package_dir = os.path.dirname(operator_dir)
        package = os.path.basename(package_dir)
        project_root = os.path.dirname(os.path.dirname(package_dir))

        return os.path.join(project_root,'testdata',package,operator, testdata_file)

    def get_file(self,testdata_file) :
        testfile = self._filename(testdata_file)
        return open(os.path.join(testfile), mode='rb').read()

    def get_msgtable(self,testdata_file) :
        map = {'int64':'BIGINT','float64':'DOUBLE','object':'NVARCHAR','bool':'BOOLEAN'}
        testfile = self._filename(testdata_file)
        df = pd.read_csv(testfile)
        columns = []
        for col in df.columns :
            columns.append({"class": str(df[df.col].dtype),"name": df.col, "type": {"hana": map(df.col.dtype)}})
        att = {'table':columns,'name':os.path.basename(self.script_path),'version':1}
        return api.Message(attributes=att,body = df.values.tolist())